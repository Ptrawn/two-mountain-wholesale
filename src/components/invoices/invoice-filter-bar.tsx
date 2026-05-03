'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface InvoiceFilterBarProps {
  initialStart: string
  initialEnd:   string
}

export function InvoiceFilterBar({ initialStart, initialEnd }: InvoiceFilterBarProps) {
  const router = useRouter()
  const [start, setStart] = useState(initialStart)
  const [end,   setEnd]   = useState(initialEnd)

  function apply() {
    const params = new URLSearchParams()
    if (start) params.set('start', start)
    if (end)   params.set('end',   end)
    const qs = params.toString()
    router.replace(`/invoices${qs ? '?' + qs : ''}`)
  }

  function clear() {
    setStart('')
    setEnd('')
    router.replace('/invoices')
  }

  const isFiltered = !!(start || end)

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">From</label>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">To</label>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={apply}
        className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Apply
      </button>
      {isFiltered && (
        <button
          onClick={clear}
          className="h-9 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Clear
        </button>
      )}
    </div>
  )
}
