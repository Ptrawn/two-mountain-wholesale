import type { Metadata } from 'next'
import Link from 'next/link'
import { CustomerForm } from '@/components/customers/customer-form'
import { createCustomer } from '@/app/customers/actions'

export const metadata: Metadata = { title: 'Add Customer — Two Mountain Wholesale' }

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/customers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> Customers
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Customer</h1>
      </div>

      <CustomerForm action={createCustomer} cancelHref="/customers" />
    </div>
  )
}
