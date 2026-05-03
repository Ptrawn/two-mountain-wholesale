'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/types/product'
import { VOLUME_OPTIONS } from '@/types/product'

type P = Pick<Product, 'id' | 'name' | 'vintage' | 'volume_ml' | 'abv_category' | 'active'>

function formatVolume(ml: number | null): string {
  if (!ml) return '—'
  return VOLUME_OPTIONS.find((o) => o.value === ml)?.label ?? `${ml} ml`
}

export function ProductSearch({ products }: { products: P[] }) {
  const [q, setQ] = useState('')

  const query    = q.trim().toLowerCase()
  const filtered = query
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        (p.vintage !== null && String(p.vintage).includes(query))
      )
    : products

  return (
    <>
      {/* Search bar */}
      <div className="mb-5 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by product name or vintage…"
            className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {query && (
          <p className="text-sm text-slate-500 shrink-0">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>

      {/* No results */}
      {query && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm font-medium text-slate-900">No products match &ldquo;{q}&rdquo;</p>
          <button onClick={() => setQ('')} className="mt-2 text-sm text-blue-600 hover:underline">Clear search</button>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Name</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">Vintage</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">Volume</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">ABV</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4 sm:px-6">
                    <Link href={`/products/${p.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {p.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell sm:px-6">
                    {p.vintage ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell sm:px-6">
                    {formatVolume(p.volume_ml)}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    {p.abv_category === 'over_14'
                      ? <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">Over 14%</span>
                      : <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">Under 14%</span>}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    {p.active
                      ? <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                      : <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">Inactive</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
