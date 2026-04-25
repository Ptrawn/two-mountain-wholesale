export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending',   label: 'Pending'   },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export interface Order {
  id: string
  customer_id: string
  order_date: string
  status: OrderStatus
  notes: string | null
  created_at: string
}

export interface OrderLineItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
}
