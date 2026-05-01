'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

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
  const router = useRouter()
  const [start,       setStart]       = useState(initialStart)
  const [end,         setEnd]         = useState(initialEnd)
  const [selectedCus, setSelectedCus] = useState<string[]>(initialCustomers)
  const [selectedPro, setSelectedPro] = useState<string[]>(initialProducts)
  const [accountType, setAccountType] = useState(initialAccountType)

  function apply() {
    const params = new URLSearchParams()
    params.set('start', start)
    params.set('end', end)
    selectedCus.forEach((id) => params.append('customers', id))
    selectedPro.forEach((id) => params.append('products', id))
    if (accountType !== 'all') params.set('account_type', accountType)
    router.replace(`/dashboard?${params.toString()}`)
  }

  function clear() {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const end   = now.toISOString().slice(0, 10)
    setStart(start)
    setEnd(end)
    setSelectedCus([])
    setSelectedPro([])
    setAccountType('all')
    router.replace('/dashboard')
  }

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
