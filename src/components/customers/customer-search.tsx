'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Customer } from '@/types/customer'

type C = Pick<Customer, 'id' | 'store_name' | 'contact_name' | 'phone' | 'email' | 'city' | 'account_type' | 'active'>

export function CustomerSearch({ customers }: { customers: C[] }) {
  const [q, setQ] = useState('')

  const query    = q.trim().toLowerCase()
  const norm     = (s: string | null | undefined) => (s ?? '').toLowerCase()
  const filtered = query
    ? customers.filter((c) =>
        norm(c.store_name).includes(query) ||
        norm(c.contact_name).includes(query) ||
        norm(c.city).includes(query)
      )
    : customers

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
            placeholder="Search by store name, contact, or city…"
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
          <p className="text-sm font-medium text-slate-900">No customers match &ldquo;{q}&rdquo;</p>
          <button onClick={() => setQ('')} className="mt-2 text-sm text-blue-600 hover:underline">Clear search</button>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Store Name</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">Contact</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">Phone</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell sm:px-6">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4 sm:px-6">
                    <Link href={`/customers/${c.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {c.store_name}
                    </Link>
                    {c.city && (
                      <p className="mt-0.5 text-xs text-slate-400 md:hidden">{c.city}</p>
                    )}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell sm:px-6">
                    {c.contact_name ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell sm:px-6">
                    {c.phone ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 lg:table-cell sm:px-6">
                    {c.email ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    {c.account_type === 'on_premise'
                      ? <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">On-Premise</span>
                      : <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Off-Premise</span>}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    {c.active
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
