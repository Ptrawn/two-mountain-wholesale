'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  previewImport,
  importCustomers,
  importProducts,
  importOrders,
  type ImportRow,
  type PreviewResult,
} from '@/app/import/actions'

// ── Excel helpers ─────────────────────────────────────────────────────────────

function excelSerialToDate(serial: number): string {
  // Excel serial 1 = 1900-01-01; adjust for the 1900 leap-year bug
  return new Date((serial - 25569) * 86400000).toISOString().slice(0, 10)
}

function parseDate(raw: unknown): string {
  if (typeof raw === 'number') return excelSerialToDate(raw)
  if (typeof raw === 'string') {
    // Try MM/DD/YYYY or YYYY-MM-DD
    const s = raw.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return ''
}

function parseVolume(raw: unknown): number {
  const s = String(raw ?? '').toLowerCase().replace(/\s/g, '')
  if (s.endsWith('ml'))  return parseInt(s)
  if (s === '1l')   return 1000
  if (s === '1.5l') return 1500
  if (s === '3l')   return 3000
  if (s === '20l')  return 20000
  if (s.endsWith('l')) return Math.round(parseFloat(s) * 1000)
  return parseInt(s) || 750
}

function parseAccountType(raw: unknown): 'on_premise' | 'off_premise' {
  const s = String(raw ?? '').toLowerCase().replace(/[^a-z]/g, '')
  if (s.includes('on') || s.includes('bar') || s.includes('rest')) return 'on_premise'
  return 'off_premise'
}

function parseRows(wb: XLSX.WorkBook): { rows: ImportRow[]; errors: string[] } {
  const ws  = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { raw: true, defval: null })

  if (raw.length === 0) return { rows: [], errors: ['Spreadsheet is empty'] }

  // Normalize header keys
  function getVal(row: Record<string, unknown>, aliases: string[]): unknown {
    for (const key of Object.keys(row)) {
      const norm = key.toLowerCase().replace(/[^a-z]/g, '')
      if (aliases.some((a) => norm === a.replace(/[^a-z]/g, ''))) return row[key]
    }
    return null
  }

  const rows: ImportRow[] = []
  const errors: string[]  = []

  for (let i = 0; i < raw.length; i++) {
    const r      = raw[i]
    const rowNum = i + 2  // +2 for header row and 1-indexing

    const date         = parseDate(getVal(r, ['date', 'orderdate', 'saledate']))
    const store        = String(getVal(r, ['store', 'storename', 'customer', 'customername']) ?? '').trim()
    const vintageRaw   = getVal(r, ['vintage'])
    const vintage      = vintageRaw ? parseInt(String(vintageRaw)) || null : null
    const product      = String(getVal(r, ['product', 'productname', 'wine', 'item']) ?? '').trim()
    const quantity     = Number(getVal(r, ['quantity', 'qty', 'bottles']) ?? 0)
    const volumeRaw    = getVal(r, ['bottlevolume', 'volume', 'size', 'bottlesize'])
    const volume_ml    = parseVolume(volumeRaw)
    const unit_price   = Number(getVal(r, ['unitprice', 'price', 'priceperbottle']) ?? 0)
    const receiptRaw   = getVal(r, ['receiptnumber', 'receipt', 'invoicenumber', 'invoiceno'])
    const receipt_number = String(receiptRaw ?? '').trim()
    const acctRaw      = getVal(r, ['accounttype', 'type', 'licenseType'])
    const account_type = parseAccountType(acctRaw)

    if (!date)           { errors.push(`Row ${rowNum}: missing or invalid date`); continue }
    if (!store)          { errors.push(`Row ${rowNum}: missing store name`); continue }
    if (!product)        { errors.push(`Row ${rowNum}: missing product name`); continue }
    if (!receipt_number) { errors.push(`Row ${rowNum}: missing receipt number`); continue }
    if (quantity <= 0)   { errors.push(`Row ${rowNum}: invalid quantity`); continue }

    rows.push({ date, store, vintage, product, quantity, volume_ml, unit_price, receipt_number, account_type })
  }

  return { rows, errors }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase =
  | { type: 'idle' }
  | { type: 'parsed'; rows: ImportRow[]; errors: string[] }
  | { type: 'previewing' }
  | { type: 'preview'; rows: ImportRow[]; result: PreviewResult }
  | { type: 'importing'; step: string; done: number; total: number }
  | { type: 'done'; inserted: number; skipped: number }
  | { type: 'error'; message: string }

// ── Component ─────────────────────────────────────────────────────────────────

export function ImportTool() {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [phase, setPhase] = useState<Phase>({ type: 'idle' })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result as ArrayBuffer
        const wb   = XLSX.read(data, { type: 'array', raw: true })
        const { rows, errors } = parseRows(wb)
        setPhase({ type: 'parsed', rows, errors })
      } catch (err) {
        setPhase({ type: 'error', message: String(err) })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handlePreview() {
    if (phase.type !== 'parsed') return
    setPhase({ type: 'previewing' })
    const result = await previewImport(phase.rows)
    if (result.error) { setPhase({ type: 'error', message: result.error }); return }
    setPhase({ type: 'preview', rows: phase.rows, result })
  }

  async function handleImport() {
    if (phase.type !== 'preview') return
    const { rows } = phase
    const total    = rows.length

    setPhase({ type: 'importing', step: 'Creating customers…', done: 0, total })
    const custResult = await importCustomers(rows)
    if (custResult.error) { setPhase({ type: 'error', message: custResult.error }); return }

    setPhase({ type: 'importing', step: 'Creating products…', done: 0, total })
    const prodResult = await importProducts(rows)
    if (prodResult.error) { setPhase({ type: 'error', message: prodResult.error }); return }

    setPhase({ type: 'importing', step: 'Importing orders…', done: 0, total })
    const ordResult = await importOrders(rows)
    if (ordResult.error) { setPhase({ type: 'error', message: ordResult.error }); return }

    setPhase({ type: 'done', inserted: ordResult.inserted, skipped: ordResult.skipped })
    if (fileRef.current) fileRef.current.value = ''
  }

  function reset() {
    setPhase({ type: 'idle' })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">

      {/* File picker */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Upload Excel File</h2>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={handleFile}
            />
            <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <span className="text-slate-500">Choose .xlsx file</span>
          </label>

          <div className="text-xs text-slate-400">
            Expected columns: Date, Store, Vintage, Product, Quantity, Bottle Volume, Unit Price, Total, Receipt Number, Account Type
          </div>
        </div>

        {/* Parse result */}
        {(phase.type === 'parsed' || phase.type === 'preview') && (
          <div className="mt-4 space-y-2">
            {phase.type === 'parsed' && phase.errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-800">{phase.errors.length} row(s) skipped due to parse errors:</p>
                <ul className="mt-1 list-disc pl-5 text-xs text-amber-700">
                  {phase.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  {phase.errors.length > 5 && <li>…and {phase.errors.length - 5} more</li>}
                </ul>
              </div>
            )}
            {(phase.rows.length > 0) && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{phase.rows.length.toLocaleString()}</span> rows parsed successfully
              </p>
            )}
          </div>
        )}
      </div>

      {/* Preview step */}
      {phase.type === 'parsed' && phase.rows.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="inline-flex h-9 items-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Preview Import
          </button>
          <button onClick={reset} className="inline-flex h-9 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Clear
          </button>
        </div>
      )}

      {phase.type === 'previewing' && (
        <p className="text-sm text-slate-500">Checking database…</p>
      )}

      {/* Preview panel */}
      {phase.type === 'preview' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700">Import Preview</h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Rows to import"   value={phase.result.toImport.toLocaleString()} />
            <Stat label="New customers"    value={phase.result.newCustomers.length.toLocaleString()} />
            <Stat label="New products"     value={phase.result.newProducts.length.toLocaleString()} />
            <Stat label="Duplicate receipts" value={phase.result.duplicates.length.toLocaleString()} highlight={phase.result.duplicates.length > 0} />
          </div>

          {phase.result.newCustomers.length > 0 && (
            <ListSection title="New customers to be created" items={phase.result.newCustomers} />
          )}
          {phase.result.newProducts.length > 0 && (
            <ListSection title="New products to be created" items={phase.result.newProducts} note="ABV category will default to Under 14% — update in Products after import." />
          )}
          {phase.result.duplicates.length > 0 && (
            <ListSection title="Duplicate receipt numbers (will be skipped)" items={phase.result.duplicates} />
          )}

          <div className="flex gap-3 pt-2">
            {phase.result.toImport > 0 ? (
              <button
                onClick={handleImport}
                className="inline-flex h-9 items-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Import {phase.result.toImport.toLocaleString()} Orders
              </button>
            ) : (
              <p className="text-sm text-slate-500">Nothing to import — all receipts already exist.</p>
            )}
            <button onClick={reset} className="inline-flex h-9 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {phase.type === 'importing' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm font-medium text-slate-700">{phase.step}</p>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-2 w-1/3 animate-pulse rounded-full bg-blue-600" />
          </div>
        </div>
      )}

      {/* Done */}
      {phase.type === 'done' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">Import complete</p>
          <p className="mt-1 text-sm text-emerald-700">
            {phase.inserted.toLocaleString()} orders imported
            {phase.skipped > 0 ? `, ${phase.skipped.toLocaleString()} skipped (duplicate receipts)` : ''}
          </p>
          <button onClick={reset} className="mt-3 inline-flex h-8 items-center rounded-md border border-emerald-300 px-3 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
            Import another file
          </button>
        </div>
      )}

      {/* Error */}
      {phase.type === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-800">Import failed</p>
          <p className="mt-1 text-sm text-red-700">{phase.message}</p>
          <button onClick={reset} className="mt-3 inline-flex h-8 items-center rounded-md border border-red-300 px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${highlight ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function ListSection({ title, items, note }: { title: string; items: string[]; note?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {note && <p className="mb-2 text-xs text-amber-600">{note}</p>}
      <div className="flex max-h-36 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        {items.map((item, i) => (
          <span key={i} className="text-xs text-slate-700">{item}</span>
        ))}
      </div>
    </div>
  )
}
