import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Invoices — Two Mountain Wholesale' }

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function InvoicesPage() {
  const supabase = createServerClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, invoice_date, attachment_url,
      orders (
        id,
        customers ( store_name ),
        order_line_items ( quantity, unit_price )
      )
    `)
    .order('created_at', { ascending: false })

  type Row = NonNullable<typeof invoices>[number]
  type OrderRow = {
    id: string
    customers: { store_name: string } | null
    order_line_items: { quantity: number; unit_price: number }[]
  }

  const enriched = invoices?.map((inv: Row) => {
    const order  = inv.orders as unknown as OrderRow | null
    const items  = order?.order_line_items ?? []
    const total  = items.reduce((s, li) => s + li.quantity * Number(li.unit_price), 0)
    return {
      id:             inv.id,
      invoice_number: inv.invoice_number,
      invoice_date:   inv.invoice_date,
      attachment_url: inv.attachment_url,
      orderId:        order?.id,
      customerName:   order?.customers?.store_name ?? '—',
      total,
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        {enriched && (
          <p className="mt-1 text-sm text-slate-500">
            {enriched.length} {enriched.length === 1 ? 'invoice' : 'invoices'}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load invoices: {error.message}
        </div>
      )}

      {!error && enriched?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">No invoices yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Invoices are generated from order detail pages.
          </p>
          <Link
            href="/orders"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Go to Orders
          </Link>
        </div>
      )}

      {!error && enriched && enriched.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Invoice #
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell sm:px-6">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Customer
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">
                  Total
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell sm:px-6">
                  Attachment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enriched.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4 sm:px-6">
                    <Link
                      href={`/api/invoices/${inv.id}/pdf`}
                      target="_blank"
                      className="font-mono text-sm font-medium text-slate-900 hover:text-blue-600"
                    >
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 sm:table-cell sm:px-6">
                    {formatDate(inv.invoice_date)}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    {inv.orderId ? (
                      <Link
                        href={`/orders/${inv.orderId}`}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {inv.customerName}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">{inv.customerName}</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-4 text-right text-sm font-medium text-slate-900 md:table-cell sm:px-6">
                    ${inv.total.toFixed(2)}
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell sm:px-6">
                    {inv.attachment_url ? (
                      <a
                        href={inv.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View scan
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
