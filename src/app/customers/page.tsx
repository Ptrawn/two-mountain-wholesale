import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CustomerSearch } from '@/components/customers/customer-search'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Customers — Two Mountain Wholesale' }

export default async function CustomersPage() {
  const supabase = createServerClient()
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, store_name, contact_name, phone, email, city, account_type, active')
    .order('store_name')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load customers: {error.message}
        </div>
      )}

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

      {!error && customers && customers.length > 0 && (
        <CustomerSearch customers={customers} />
      )}
    </div>
  )
}
