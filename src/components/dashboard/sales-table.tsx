'use client'

import { Fragment, useState } from 'react'
import type { ProductSalesRow } from '@/lib/dashboard'

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function SalesTable({ data }: { data: ProductSalesRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
        <p className="text-sm text-slate-400">No sales data for this period</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-700">Sales by Product</h2>
        <p className="mt-0.5 text-xs text-slate-400">Click a row to see customer breakdown</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50">
              <th className="w-8 px-5 py-3" />
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bottles
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => {
              const isOpen = expanded.has(row.product_id)
              return (
                <Fragment key={row.product_id}>
                  <tr
                    onClick={() => toggle(row.product_id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 text-slate-400">
                      <svg
                        className={`h-4 w-4 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{row.product_name}</span>
                      {row.vintage
                        ? <span className="ml-2 text-sm text-slate-400">{row.vintage}</span>
                        : null}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-slate-700">
                      {row.bottles.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-medium text-slate-900">
                      {fmtMoney(row.revenue)}
                    </td>
                  </tr>

                  {isOpen && row.customers.map((c) => (
                    <tr key={`${row.product_id}-${c.customer_id}`} className="bg-slate-50/70">
                      <td className="px-5 py-2" />
                      <td className="py-2 pl-12 pr-5 text-sm text-slate-600">{c.customer_name}</td>
                      <td className="px-5 py-2 text-right text-sm text-slate-500">
                        {c.bottles.toLocaleString()}
                      </td>
                      <td className="px-5 py-2 text-right text-sm text-slate-500">
                        {fmtMoney(c.revenue)}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
