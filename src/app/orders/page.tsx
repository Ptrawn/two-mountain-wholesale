import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { OrderStatus } from '@/types/order'

export const metadata: Metadata = { title: 'Orders — Two Mountain Wholesale' }

function fmt(n: number) {
  return '$' + n.toFixed(2)
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function OrdersPage() {
  const supabase = createServerClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, order_date, status, created_at,
      customers ( store_name ),
      order_line_items ( quantity, unit_price )
    `)
    .order('order_date', { ascending: false })

  type Row = NonNullable<typeof orders>[number]
  const enriched = orders?.map((o: Row) => {
    const items = (o.order_line_items ?? []) as { quantity: number; unit_price: number }[]
    return {
      id:           o.id,
      order_date:   o.order_date,
      status:       o.status as OrderStatus,
      customerName: (o.customers as unknown as { store_name: string } | null)?.store_name ?? '—',
      itemCount:    items.length,
      total:        items.reduce((s, li) => s + li.quantity * li.unit_price, 0),
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          {enriched && (
            <p className="mt-1 text-sm text-slate-500">
              {enriched.length} {enriched.length === 1 ? 'order' : 'orders'}
            </p>
          )}
        </div>
        <Link
          href="/orders/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <span aria-hidden>+</span> New Order
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load orders: {error.message}
        </div>
      )}

      {!error && enriched?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">No orders yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first order to get started.</p>
          <Link
            href="/orders/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <span aria-hidden>+</span> New Order
          </Link>
        </div>
      )}

      {!error && enriched && enriched.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Customer
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell sm:px-6">
                  Items
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enriched.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                    <Link href={`/orders/${o.id}`} className="hover:text-blue-600">
                      {formatDate(o.order_date)}
                    </Link>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {o.customerName}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 sm:table-cell sm:px-6">
                    {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                  </td>
                  <td className="hidden px-4 py-4 text-right text-sm font-medium text-slate-900 md:table-cell sm:px-6">
                    {fmt(o.total)}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <StatusBadge status={o.status} />
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

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    pending:   'bg-amber-100 text-amber-700',
    confirmed: 'bg-sky-100 text-sky-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-500',
  }
  const labels: Record<OrderStatus, string> = {
    pending:   'Pending',
    confirmed: 'Confirmed',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  )
}
