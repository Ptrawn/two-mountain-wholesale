import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Customer } from '@/types/customer'

export const metadata: Metadata = { title: 'Customers — Two Mountain Wholesale' }

export default async function CustomersPage() {
  const supabase = createServerClient()
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, store_name, contact_name, phone, email, account_type, active')
    .order('store_name')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          {customers && (
            <p className="mt-1 text-sm text-slate-500">
              {customers.length} {customers.length === 1 ? 'account' : 'accounts'}
            </p>
          )}
        </div>
        <Link
          href="/customers/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <span aria-hidden>+</span> Add Customer
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load customers: {error.message}
        </div>
      )}

      {/* Empty state */}
      {!error && customers?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">No customers yet</p>
          <p className="mt-1 text-sm text-slate-500">Get started by adding your first account.</p>
          <Link
            href="/customers/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <span aria-hidden>+</span> Add Customer
          </Link>
        </div>
      )}

      {/* Table */}
      {!error && customers && customers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Store Name
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">
                  Contact
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">
                  Phone
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell sm:px-6">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(customers as Pick<Customer, 'id' | 'store_name' | 'contact_name' | 'phone' | 'email' | 'account_type' | 'active'>[]).map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4 sm:px-6">
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {c.store_name}
                    </Link>
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
                    <AccountTypeBadge type={c.account_type} />
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <StatusBadge active={c.active} />
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

function AccountTypeBadge({ type }: { type: string }) {
  if (type === 'on_premise') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        On-Premise
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      Off-Premise
    </span>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
      Inactive
    </span>
  )
}
