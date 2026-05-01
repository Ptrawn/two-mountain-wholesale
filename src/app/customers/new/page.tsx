import type { Metadata } from 'next'
import Link from 'next/link'
import { CustomerForm } from '@/components/customers/customer-form'
import { createCustomer } from '@/app/customers/actions'
import { createServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Add Customer — Two Mountain Wholesale' }

type SP = Promise<{ from_prospect?: string | string[] }>

export default async function NewCustomerPage({ searchParams }: { searchParams: SP }) {
  const sp             = await searchParams
  const prospectId     = Array.isArray(sp.from_prospect) ? sp.from_prospect[0] : sp.from_prospect
  const cancelHref     = prospectId ? '/prospects' : '/customers'

  let defaults: Parameters<typeof CustomerForm>[0]['defaults'] = undefined

  if (prospectId) {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('prospects')
      .select('store_name, address, city, state, zip, liquor_license_number, license_type, phone')
      .eq('id', prospectId)
      .single()

    if (data) {
      defaults = {
        store_name:            data.store_name,
        account_type:          data.license_type as 'on_premise' | 'off_premise',
        address:               data.address    ?? undefined,
        city:                  data.city       ?? undefined,
        state:                 data.state      ?? undefined,
        zip:                   data.zip        ?? undefined,
        liquor_license_number: data.liquor_license_number ?? undefined,
        phone:                 data.phone      ?? undefined,
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={cancelHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> {prospectId ? 'Prospects' : 'Customers'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Customer</h1>
      </div>

      <CustomerForm action={createCustomer} cancelHref={cancelHref} defaults={defaults} />
    </div>
  )
}
