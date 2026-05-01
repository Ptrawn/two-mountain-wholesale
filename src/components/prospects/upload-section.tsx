'use client'

import { useRef, useState } from 'react'
import { importProspectBatch, type ProspectInput } from '@/app/prospects/actions'

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVRow(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (c === ',' && !inQ) {
      fields.push(cur.trim()); cur = ''
    } else {
      cur += c
    }
  }
  fields.push(cur.trim())
  return fields
}

function parseCSV(text: string): string[][] {
  return text.split(/\r?\n/).filter((l) => l.trim()).map(parseCSVRow)
}

// ── Column mapping ────────────────────────────────────────────────────────────

const ALIASES: Record<string, string[]> = {
  store_name: [
    'trade name', 'trade dba name', 'trade  dba name', 'dba name', 'dba',
    'business name', 'licensee name', 'licensee', 'establishment name',
    'premise name', 'name',
  ],
  address: ['premises address', 'prem address', 'street address', 'address', 'street'],
  city:    ['premises city', 'prem city', 'city'],
  state:   ['premises state', 'prem state', 'state'],
  zip:     ['zip code', 'premises zip', 'prem zip', 'postal code', 'zip'],
  license: [
    'license number', 'license no', 'lic number',
    'ubi number', 'ubi', 'license',
  ],
  phone:   ['phone number', 'business phone', 'telephone', 'phone', 'tel'],
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function findColIdx(headers: string[], aliases: string[]): number {
  const nh = headers.map(norm)
  const na = aliases.map(norm)
  for (const a of na) { const i = nh.indexOf(a); if (i !== -1) return i }
  for (const a of na) { const i = nh.findIndex((h) => h.includes(a)); if (i !== -1) return i }
  return -1
}

function mapCSV(
  rows: string[][],
  licenseType: 'on_premise' | 'off_premise',
): { prospects: ProspectInput[]; missingRequired: string[] } {
  if (rows.length < 2) return { prospects: [], missingRequired: ['No data rows found'] }

  const headers = rows[0]
  const cols = {
    store_name: findColIdx(headers, ALIASES.store_name),
    address:    findColIdx(headers, ALIASES.address),
    city:       findColIdx(headers, ALIASES.city),
    state:      findColIdx(headers, ALIASES.state),
    zip:        findColIdx(headers, ALIASES.zip),
    license:    findColIdx(headers, ALIASES.license),
    phone:      findColIdx(headers, ALIASES.phone),
  }

  const missingRequired: string[] = []
  if (cols.store_name === -1) missingRequired.push('store name')
  if (cols.license    === -1) missingRequired.push('license number')
  if (missingRequired.length > 0) return { prospects: [], missingRequired }

  const get = (row: string[], i: number) => (i === -1 ? null : row[i]?.trim() || null)

  const prospects: ProspectInput[] = []
  for (const row of rows.slice(1)) {
    const license = get(row, cols.license)
    const name    = get(row, cols.store_name)
    if (!license || !name) continue
    prospects.push({
      store_name:            name,
      address:               get(row, cols.address),
      city:                  get(row, cols.city),
      state:                 get(row, cols.state),
      zip:                   get(row, cols.zip),
      liquor_license_number: license,
      license_type:          licenseType,
      phone:                 get(row, cols.phone),
    })
  }

  return { prospects, missingRequired: [] }
}

// ── Component ─────────────────────────────────────────────────────────────────

const BATCH = 500

type FileInfo = {
  name:      string
  prospects: ProspectInput[]
  error?:    string
}

type ImportStatus =
  | { type: 'idle' }
  | { type: 'importing'; done: number; total: number }
  | { type: 'done'; inserted: number; skipped: number }
  | { type: 'error'; message: string }

export function UploadSection() {
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [licenseType, setLicenseType] = useState<'on_premise' | 'off_premise'>('on_premise')
  const [fileInfo,    setFileInfo]    = useState<FileInfo | null>(null)
  const [status,      setStatus]      = useState<ImportStatus>({ type: 'idle' })

  function handleLicenseTypeChange(next: 'on_premise' | 'off_premise') {
    setLicenseType(next)
    // Re-parse the already-selected file under the new type
    if (fileInfo && !fileInfo.error && fileRef.current?.files?.[0]) {
      readFile(fileRef.current.files[0], next)
    }
  }

  function readFile(file: File, type: 'on_premise' | 'off_premise') {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      const { prospects, missingRequired } = mapCSV(rows, type)
      if (missingRequired.length > 0) {
        setFileInfo({ name: file.name, prospects: [], error: `Could not find columns: ${missingRequired.join(', ')}` })
      } else {
        setFileInfo({ name: file.name, prospects })
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const rows = fileInfo?.prospects ?? []
    if (rows.length === 0) return

    const batches: ProspectInput[][] = []
    for (let i = 0; i < rows.length; i += BATCH) batches.push(rows.slice(i, i + BATCH))

    setStatus({ type: 'importing', done: 0, total: rows.length })
    let totalInserted = 0
    let totalSkipped  = 0
    let done          = 0

    for (const batch of batches) {
      const result = await importProspectBatch(batch)
      if (result.error) { setStatus({ type: 'error', message: result.error }); return }
      totalInserted += result.inserted
      totalSkipped  += result.skipped
      done          += batch.length
      setStatus({ type: 'importing', done, total: rows.length })
    }

    setStatus({ type: 'done', inserted: totalInserted, skipped: totalSkipped })
    setFileInfo(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const rowCount  = fileInfo?.prospects.length ?? 0
  const canImport = rowCount > 0 && status.type !== 'importing'
  const importing = status.type === 'importing'

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Import from CSV</h2>

      <div className="flex flex-wrap items-start gap-6">
        {/* Type toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-500">License Type</span>
          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5">
            {(['on_premise', 'off_premise'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleLicenseTypeChange(t)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  licenseType === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'on_premise' ? 'On-Premise' : 'Off-Premise'}
              </button>
            ))}
          </div>
        </div>

        {/* File picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-500">CSV File</span>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) { setFileInfo(null); return }
                readFile(file, licenseType)
              }}
            />
            <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            {fileInfo ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{fileInfo.name}</p>
                {fileInfo.error
                  ? <p className="text-xs text-red-600">{fileInfo.error}</p>
                  : <p className="text-xs text-emerald-600">{fileInfo.prospects.length.toLocaleString()} rows found</p>}
              </div>
            ) : (
              <span className="text-slate-500">Choose CSV file</span>
            )}
          </label>
        </div>
      </div>

      {/* Progress bar */}
      {importing && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Importing…</span>
            <span>{status.done.toLocaleString()} / {status.total.toLocaleString()}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.round((status.done / status.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {status.type === 'done' && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Import complete — {status.inserted.toLocaleString()} new
          {status.skipped > 0 ? `, ${status.skipped.toLocaleString()} already existed (skipped)` : ''}
        </div>
      )}

      {status.type === 'error' && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Import failed: {status.message}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={handleImport}
          disabled={!canImport}
          className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
        >
          {importing
            ? 'Importing…'
            : rowCount > 0
              ? `Import ${rowCount.toLocaleString()} rows as ${licenseType === 'on_premise' ? 'On-Premise' : 'Off-Premise'}`
              : 'Import'}
        </button>
      </div>
    </div>
  )
}
