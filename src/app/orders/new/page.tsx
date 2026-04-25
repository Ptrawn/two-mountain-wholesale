import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { OrderForm } from '@/components/orders/order-form'
import { createOrder } from '@/app/orders/actions'
import type { Customer } from '@/types/customer'
import type { Product } from '@/types/product'

export const metadata: Metadata = { title: 'New Order — Two Mountain Wholesale' }

export default async function NewOrderPage() {
  const supabase = createServerClient()

  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase
      .from('customers')
      .select('id, store_name, account_type')
      .eq('active', true)
      .order('store_name'),
    supabase
      .from('products')
      .select('id, name, volume_ml, abv_category')
      .eq('active', true)
      .order('name'),
  ])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> Orders
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Order</h1>
      </div>

      <OrderForm
        customers={(customers ?? []) as Pick<Customer, 'id' | 'store_name' | 'account_type'>[]}
        products={(products ?? []) as Pick<Product, 'id' | 'name' | 'volume_ml' | 'abv_category'>[]}
        action={createOrder}
        today={today}
      />
    </div>
  )
}
