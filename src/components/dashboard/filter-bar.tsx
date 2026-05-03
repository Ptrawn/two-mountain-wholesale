'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

// ── Preset date ranges ────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

type Preset = { label: string; start: string; end: string }

function buildPresets(): Preset[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Last Week: Mon–Sun of the previous calendar week
  const dow = today.getDay() // 0=Sun
  const daysToLastMon = dow === 0 ? 13 : dow + 6
  const lastMon = new Date(today); lastMon.setDate(today.getDate() - daysToLastMon)
  const lastSun = new Date(lastMon); lastSun.setDate(lastMon.getDate() + 6)

  // Last Month
  const firstThisMonth  = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastOfLastMonth = new Date(firstThisMonth); lastOfLastMonth.setDate(0)
  const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1)

  // Last 3 Months: 1st of 3 months ago → last day of last month
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1)

  // Last Quarter
  const currentQ = Math.floor(today.getMonth() / 3)
  const lastQYear  = currentQ === 0 ? today.getFullYear() - 1 : today.getFullYear()
  const lastQMonth = currentQ === 0 ? 9 : (currentQ - 1) * 3   // start month of last quarter
  const lastQStart = new Date(lastQYear, lastQMonth, 1)
  const lastQEnd   = new Date(lastQYear, lastQMonth + 3, 0)

  // Last Year
  const ly = today.getFullYear() - 1

  return [
    { label: 'Last Week',      start: isoDate(lastMon),        end: isoDate(lastSun)        },
    { label: 'Last Month',     start: isoDate(firstOfLastMonth), end: isoDate(lastOfLastMonth) },
    { label: 'Last 3 Months',  start: isoDate(threeMonthsAgo), end: isoDate(lastOfLastMonth) },
    { label: 'Last Quarter',   start: isoDate(lastQStart),     end: isoDate(lastQEnd)       },
    { label: 'Last Year',      start: `${ly}-01-01`,           end: `${ly}-12-31`           },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

interface FilterBarProps {
  customers:          { id: string; store_name: string }[]
  products:           { id: string; name: string }[]
  initialStart:       string
  initialEnd:         string
  initialCustomers:   string[]
  initialProducts:    string[]
  initialAccountType: 'all' | 'on_premise' | 'off_premise'
}

export function FilterBar({
  customers,
  products,
  initialStart,
  initialEnd,
  initialCustomers,
  initialProducts,
  initialAccountType,
}: FilterBarProps) {
  const router  = useRouter()
  const presets = buildPresets()

  const [start,       setStart]       = useState(initialStart)
  const [end,         setEnd]         = useState(initialEnd)
  const [selectedCus, setSelectedCus] = useState<string[]>(initialCustomers)
  const [selectedPro, setSelectedPro] = useState<string[]>(initialProducts)
  const [accountType, setAccountType] = useState(initialAccountType)

  const activePreset = presets.find((p) => p.start === start && p.end === end) ?? null

  function applyDates(s: string, e: string) {
    const params = new URLSearchParams()
    params.set('start', s)
    params.set('end', e)
    selectedCus.forEach((id) => params.append('customers', id))
    selectedPro.forEach((id) => params.append('products', id))
    if (accountType !== 'all') params.set('account_type', accountType)
    router.replace(`/dashboard?${params.toString()}`)
  }

  function apply() { applyDates(start, end) }

  function applyPreset(p: Preset) {
    setStart(p.start)
    setEnd(p.end)
    applyDates(p.start, p.end)
  }

  function clear() {
    const now = new Date()
    const s   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const e   = now.toISOString().slice(0, 10)
    setStart(s)
    setEnd(e)
    setSelectedCus([])
    setSelectedPro([])
    setAccountType('all')
    router.replace('/dashboard')
  }

  function handleExport() {
    const params = new URLSearchParams()
    params.set('start', start)
    params.set('end', end)
    selectedCus.forEach((id) => params.append('customers', id))
    selectedPro.forEach((id) => params.append('products', id))
    if (accountType !== 'all') params.set('account_type', accountType)
    const a = document.createElement('a')
    a.href = `/api/dashboard/export?${params.toString()}`
    a.download = `two-mountain-sales-${start}-to-${end}.csv`
    a.click()
  }

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Preset buttons */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = activePreset?.label === p.label
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Date + filter row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">From</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">To</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <MultiSelect
          label="Customers"
          options={customers.map((c) => ({ value: c.id, label: c.store_name }))}
          selected={selectedCus}
          onChange={setSelectedCus}
        />

        <MultiSelect
          label="Products"
          options={products.map((p) => ({ value: p.id, label: p.name }))}
          selected={selectedPro}
          onChange={setSelectedPro}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Account Type</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as 'all' | 'on_premise' | 'off_premise')}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="on_premise">On-Premise</option>
            <option value="off_premise">Off-Premise</option>
          </select>
        </div>

        <button
          onClick={apply}
          className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={clear}
          className="h-9 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Clear
        </button>
        <button
          onClick={handleExport}
          className="ml-auto h-9 inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  )
}

interface MultiSelectProps {
  label:    string
  options:  { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const buttonLabel =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? '1 selected')
        : `${selected.length} ${label.toLowerCase()}`

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 min-w-[150px] items-center justify-between gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-900 hover:bg-slate-50 focus:outline-none"
      >
        <span className="truncate">{buttonLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white shadow-lg">
          {options.length > 8 && (
            <div className="border-b border-slate-100 p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No results</div>
            )}
            {filtered.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
