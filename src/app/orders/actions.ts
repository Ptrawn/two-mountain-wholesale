'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type FormState = {
  errors?: {
    customer_id?: string
    order_date?: string
    status?: string
    line_items?: string
  }
  message?: string
}

type LineItemInput = {
  product_id: string
  quantity: number
  unit_price: number
}

export async function createOrder(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const customer_id = (formData.get('customer_id') as string | null)?.trim() ?? ''
  const order_date  = (formData.get('order_date')  as string | null)?.trim() ?? ''
  const status      = (formData.get('status')       as string | null)?.trim() ?? ''
  const notes       = (formData.get('notes')        as string | null)?.trim() || null

  const errors: FormState['errors'] = {}

  if (!customer_id) errors.customer_id = 'Customer is required.'
  if (!order_date)  errors.order_date  = 'Order date is required.'
  if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
    errors.status = 'Status is required.'
  }

  let lineItems: LineItemInput[] = []
  const raw = formData.get('line_items') as string | null
  try {
    lineItems = raw ? (JSON.parse(raw) as LineItemInput[]) : []
  } catch {
    errors.line_items = 'Invalid line item data.'
  }

  if (!errors.line_items) {
    if (lineItems.length === 0) {
      errors.line_items = 'Add at least one line item.'
    } else {
      for (const item of lineItems) {
        if (!item.product_id)     { errors.line_items = 'All line items must have a product selected.'; break }
        if (item.quantity < 1)    { errors.line_items = 'Quantity must be at least 1.'; break }
        if (item.unit_price < 0)  { errors.line_items = 'Unit price cannot be negative.'; break }
      }
    }
  }

  if (Object.keys(errors).length > 0) return { errors }

  const supabase = createServerClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ customer_id, order_date, status, notes })
    .select('id')
    .single()

  if (orderError || !order) {
    return { message: orderError?.message ?? 'Failed to create order.' }
  }

  const { error: lineError } = await supabase
    .from('order_line_items')
    .insert(
      lineItems.map((item) => ({
        order_id:   order.id,
        product_id: item.product_id,
        quantity:   item.quantity,
        unit_price: item.unit_price,
      })),
    )

  if (lineError) {
    await supabase.from('orders').delete().eq('id', order.id)
    return { message: lineError.message }
  }

  revalidatePath('/orders')
  redirect(`/orders/${order.id}`)
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<{ error?: string }> {
  if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
    return { error: 'Invalid status.' }
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  return {}
}
