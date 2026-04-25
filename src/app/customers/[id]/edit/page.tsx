import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Customer } from '@/types/customer'
import { CustomerForm } from '@/components/customers/customer-form'
import { updateCustomer } from '@/app/customers/actions'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase
    .from('customers')
    .select('store_name')
    .eq('id', id)
    .single()
  return { title: data ? `Edit ${data.store_name} — Two Mountain Wholesale` : 'Edit Customer' }
}

export default async function EditCustomerPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (!customer) notFound()

  const c = customer as Customer

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/customers/${c.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> {c.store_name}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Customer</h1>
      </div>

      <CustomerForm
        customer={c}
        action={updateCustomer}
        cancelHref={`/customers/${c.id}`}
      />
    </div>
  )
}
