import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { OrderStatus } from '@/types/order'
import { VOLUME_OPTIONS } from '@/types/product'
import { StatusSelect } from '@/components/orders/status-select'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase
    .from('orders')
    .select('order_date, customers ( store_name )')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Order — Two Mountain Wholesale' }
  const customer = (data.customers as unknown as { store_name: string } | null)?.store_name ?? 'Order'
  return { title: `${customer} — Two Mountain Wholesale` }
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()

  const { data } = await supabase
    .from('orders')
    .select(`
      id, order_date, status, notes, created_at,
      customers ( id, store_name, contact_name, phone, email, address, city, state, zip, account_type ),
      order_line_items (
        id, quantity, unit_price,
        products ( id, name, volume_ml, abv_category )
      )
    `)
    .eq('id', id)
    .single()

  if (!data) notFound()

  type CustomerRow = {
    id: string; store_name: string; contact_name: string | null
    phone: string | null; email: string | null; address: string | null
    city: string | null; state: string | null; zip: string | null
    account_type: string
  }
  type ProductRow = { id: string; name: string; volume_ml: number | null; abv_category: string }
  type LineRow    = { id: string; quantity: number; unit_price: number; products: ProductRow | null }

  const customer  = data.customers as unknown as CustomerRow | null
  const lineItems = (data.order_line_items ?? []) as unknown as LineRow[]
  const status    = data.status as OrderStatus
  const orderTotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> Orders
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {customer?.store_name ?? 'Order'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusSelect orderId={data.id} initialStatus={status} />
              <span className="text-sm text-slate-500">{formatDate(data.order_date)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Customer card */}
        {customer && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </h2>
              <Link
                href={`/customers/${customer.id}`}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View profile →
              </Link>
            </div>
            <dl className="space-y-2">
              <DetailRow label="Store"   value={customer.store_name} />
              <DetailRow label="Contact" value={customer.contact_name} />
              <DetailRow label="Phone"   value={customer.phone} />
              <DetailRow label="Email"   value={customer.email} />
              {(customer.city || customer.state) && (
                <DetailRow
                  label="Location"
                  value={[customer.city, customer.state].filter(Boolean).join(', ')}
                />
              )}
              <DetailRow
                label="Type"
                value={customer.account_type === 'on_premise' ? 'On-premise' : 'Off-premise'}
              />
            </dl>
          </div>
        )}

        {/* Order info card */}
        {data.notes && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Notes
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Line items card */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Line Items
            </h2>
          </div>

          {lineItems.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-400">No line items.</p>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="divide-y divide-slate-100 sm:hidden">
                {lineItems.map((li) => {
                  const vol = VOLUME_OPTIONS.find((o) => o.value === li.products?.volume_ml)
                  return (
                    <div key={li.id} className="px-6 py-4">
                      <p className="font-medium text-slate-900">{li.products?.name ?? '—'}</p>
                      {vol && <p className="mt-0.5 text-xs text-slate-400">{vol.label}</p>}
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          {li.quantity} × ${li.unit_price.toFixed(2)}
                        </span>
                        <span className="font-semibold text-slate-900">
                          ${(li.quantity * li.unit_price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop: table */}
              <table className="hidden min-w-full sm:table">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Product
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((li) => {
                    const vol = VOLUME_OPTIONS.find((o) => o.value === li.products?.volume_ml)
                    return (
                      <tr key={li.id}>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{li.products?.name ?? '—'}</p>
                          {vol && <p className="text-xs text-slate-400">{vol.label}</p>}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600">{li.quantity}</td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600">
                          ${li.unit_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                          ${(li.quantity * li.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Total row */}
          <div className="flex items-center justify-end border-t border-slate-200 px-6 py-4">
            <span className="text-sm font-medium text-slate-500">Order Total</span>
            <span className="ml-6 text-lg font-bold text-slate-900">
              ${orderTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">
        {value ?? <span className="text-slate-400">—</span>}
      </dd>
    </div>
  )
}


function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}
