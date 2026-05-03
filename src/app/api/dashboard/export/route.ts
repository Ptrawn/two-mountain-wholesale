import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

type RawLineItem = {
  quantity:  number
  unit_price: number
  products:  { id: string; name: string; vintage: number | null; volume_ml: number | null; abv_category: string } | null
}

type RawOrder = {
  id:         string
  order_date: string
  customers:  { id: string; store_name: string; account_type: string; city: string | null; state: string | null } | null
  order_line_items: RawLineItem[]
  invoices:   { invoice_number: string }[]
}

export async function GET(request: NextRequest) {
  const sp          = request.nextUrl.searchParams
  const start       = sp.get('start') ?? ''
  const end         = sp.get('end') ?? ''
  const customerIds = sp.getAll('customers')
  const productIds  = sp.getAll('products')
  const accountType = sp.get('account_type') ?? 'all'

  if (!start || !end) return new NextResponse('Missing date range', { status: 400 })

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_date,
      customers ( id, store_name, account_type, city, state ),
      order_line_items (
        quantity, unit_price,
        products ( id, name, vintage, volume_ml, abv_category )
      ),
      invoices ( invoice_number )
    `)
    .gte('order_date', start)
    .lte('order_date', end)
    .not('status', 'eq', 'cancelled')
    .order('order_date', { ascending: true })

  if (error) return new NextResponse(`Database error: ${error.message}`, { status: 500 })

  const orders = (data ?? []) as unknown as RawOrder[]

  const csvRows: string[] = [
    ['Date', 'Customer Name', 'Account Type', 'City', 'State',
     'Product Name', 'Vintage', 'Volume (ml)', 'ABV Category',
     'Quantity', 'Unit Price', 'Line Total', 'Order Total', 'Invoice Number'].join(','),
  ]

  for (const order of orders) {
    const customer = order.customers
    if (!customer) continue
    if (customerIds.length > 0 && !customerIds.includes(customer.id)) continue
    if (accountType !== 'all' && customer.account_type !== accountType) continue

    const lineItems    = order.order_line_items ?? []
    const invoiceNum   = order.invoices?.[0]?.invoice_number ?? ''
    const orderTotal   = lineItems.reduce((s, li) => s + li.quantity * Number(li.unit_price), 0)
    const accountLabel = customer.account_type === 'on_premise' ? 'On-Premise' : 'Off-Premise'
    const abvLabel     = (cat: string) => cat === 'over_14' ? 'Over 14%' : 'Under 14%'

    for (const li of lineItems) {
      const product = li.products
      if (!product) continue
      if (productIds.length > 0 && !productIds.includes(product.id)) continue

      csvRows.push([
        csvCell(order.order_date),
        csvCell(customer.store_name),
        csvCell(accountLabel),
        csvCell(customer.city),
        csvCell(customer.state),
        csvCell(product.name),
        csvCell(product.vintage),
        csvCell(product.volume_ml),
        csvCell(abvLabel(product.abv_category)),
        csvCell(li.quantity),
        csvCell(Number(li.unit_price).toFixed(2)),
        csvCell((li.quantity * Number(li.unit_price)).toFixed(2)),
        csvCell(orderTotal.toFixed(2)),
        csvCell(invoiceNum),
      ].join(','))
    }
  }

  const filename = `two-mountain-sales-${start}-to-${end}.csv`

  return new NextResponse(csvRows.join('\r\n'), {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
