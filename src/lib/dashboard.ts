export interface FlatRow {
  order_id:      string
  order_date:    string
  customer_id:   string
  customer_name: string
  account_type:  'on_premise' | 'off_premise'
  product_id:    string
  product_name:  string
  vintage:       number | null
  volume_ml:     number | null
  quantity:      number
  unit_price:    number
  line_total:    number
}

export type RawProductRow  = { id: string; name: string; vintage: number | null; volume_ml: number | null }
export type RawLineItemRow = { quantity: number; unit_price: number; products: RawProductRow | null }
export type RawCustomerRow = { id: string; store_name: string; account_type: string }
export type RawOrderRow    = {
  id: string
  order_date: string
  customers: RawCustomerRow | null
  order_line_items: RawLineItemRow[]
}

export function flattenOrders(orders: RawOrderRow[]): FlatRow[] {
  const rows: FlatRow[] = []
  for (const order of orders) {
    const customer = order.customers
    if (!customer) continue
    for (const li of order.order_line_items) {
      const product = li.products
      if (!product) continue
      rows.push({
        order_id:      order.id,
        order_date:    order.order_date,
        customer_id:   customer.id,
        customer_name: customer.store_name,
        account_type:  customer.account_type as 'on_premise' | 'off_premise',
        product_id:    product.id,
        product_name:  product.name,
        vintage:       product.vintage,
        volume_ml:     product.volume_ml,
        quantity:      li.quantity,
        unit_price:    Number(li.unit_price),
        line_total:    li.quantity * Number(li.unit_price),
      })
    }
  }
  return rows
}

export interface DashboardFilters {
  customerIds: string[]
  productIds:  string[]
  accountType: 'all' | 'on_premise' | 'off_premise'
}

export function applyFilters(rows: FlatRow[], filters: DashboardFilters): FlatRow[] {
  return rows.filter((r) => {
    if (filters.customerIds.length > 0 && !filters.customerIds.includes(r.customer_id)) return false
    if (filters.productIds.length  > 0 && !filters.productIds.includes(r.product_id))   return false
    if (filters.accountType !== 'all' && r.account_type !== filters.accountType)          return false
    return true
  })
}

export interface DashboardMetrics {
  revenue:        number
  bottles:        number
  orders:         number
  activeAccounts: number
}

export function computeMetrics(rows: FlatRow[]): DashboardMetrics {
  const orderIds   = new Set<string>()
  const accountIds = new Set<string>()
  let revenue = 0
  let bottles = 0
  for (const r of rows) {
    revenue += r.line_total
    bottles += r.quantity
    orderIds.add(r.order_id)
    accountIds.add(r.customer_id)
  }
  return { revenue, bottles, orders: orderIds.size, activeAccounts: accountIds.size }
}

export interface MonthlyRevenue {
  month:   string // 'YYYY-MM'
  revenue: number
}

export function computeMonthlyRevenue(rows: FlatRow[]): MonthlyRevenue[] {
  const map = new Map<string, number>()
  for (const r of rows) {
    const month = r.order_date.slice(0, 7)
    map.set(month, (map.get(month) ?? 0) + r.line_total)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }))
}

export interface ProductRevenue {
  product_id:   string
  product_name: string
  vintage:      number | null
  revenue:      number
  bottles:      number
}

export function computeTopProducts(rows: FlatRow[], limit = 10): ProductRevenue[] {
  const map = new Map<string, ProductRevenue>()
  for (const r of rows) {
    const existing = map.get(r.product_id)
    if (existing) {
      existing.revenue += r.line_total
      existing.bottles += r.quantity
    } else {
      map.set(r.product_id, {
        product_id:   r.product_id,
        product_name: r.product_name,
        vintage:      r.vintage,
        revenue:      r.line_total,
        bottles:      r.quantity,
      })
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export interface AccountTypeRevenue {
  name:    string
  revenue: number
}

export function computeByAccountType(rows: FlatRow[]): AccountTypeRevenue[] {
  let on_premise  = 0
  let off_premise = 0
  for (const r of rows) {
    if (r.account_type === 'on_premise') on_premise  += r.line_total
    else                                  off_premise += r.line_total
  }
  return [
    { name: 'On-Premise',  revenue: on_premise  },
    { name: 'Off-Premise', revenue: off_premise },
  ]
}

export interface CustomerSales {
  customer_id:   string
  customer_name: string
  bottles: number
  revenue: number
}

export interface ProductSalesRow {
  product_id:   string
  product_name: string
  vintage:      number | null
  bottles:      number
  revenue:      number
  customers:    CustomerSales[]
}

export function computeSalesByProduct(rows: FlatRow[]): ProductSalesRow[] {
  const products = new Map<string, {
    name:      string
    vintage:   number | null
    bottles:   number
    revenue:   number
    customers: Map<string, CustomerSales>
  }>()

  for (const r of rows) {
    let p = products.get(r.product_id)
    if (!p) {
      p = { name: r.product_name, vintage: r.vintage, bottles: 0, revenue: 0, customers: new Map() }
      products.set(r.product_id, p)
    }
    p.bottles += r.quantity
    p.revenue += r.line_total

    let c = p.customers.get(r.customer_id)
    if (!c) {
      c = { customer_id: r.customer_id, customer_name: r.customer_name, bottles: 0, revenue: 0 }
      p.customers.set(r.customer_id, c)
    }
    c.bottles += r.quantity
    c.revenue += r.line_total
  }

  return Array.from(products.entries())
    .map(([product_id, p]) => ({
      product_id,
      product_name: p.name,
      vintage:      p.vintage,
      bottles:      p.bottles,
      revenue:      p.revenue,
      customers:    Array.from(p.customers.values()).sort((a, b) => b.revenue - a.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function parseDate(s: string | undefined, fallback: Date): Date {
  if (!s) return fallback
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? fallback : d
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function getDefaultDateRange(): { start: Date; end: Date } {
  const now = new Date()
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
}

export function getPriorPeriod(start: Date, end: Date): { start: Date; end: Date } {
  const durationDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const priorEnd     = new Date(start.getTime() - 86400000)
  const priorStart   = new Date(priorEnd.getTime() - (durationDays - 1) * 86400000)
  return { start: priorStart, end: priorEnd }
}

export function getPriorYear(start: Date, end: Date): { start: Date; end: Date } {
  const shift = (d: Date) => new Date(d.getFullYear() - 1, d.getMonth(), d.getDate())
  return { start: shift(start), end: shift(end) }
}
