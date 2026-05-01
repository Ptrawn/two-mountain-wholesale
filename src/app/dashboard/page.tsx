import { createServerClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import {
  flattenOrders,
  applyFilters,
  computeMetrics,
  computeMonthlyRevenue,
  computeTopProducts,
  computeByAccountType,
  computeSalesByProduct,
  parseDate,
  toISODate,
  getDefaultDateRange,
  getPriorPeriod,
  getPriorYear,
  type DashboardFilters,
  type RawOrderRow,
} from '@/lib/dashboard'
import { FilterBar }        from '@/components/dashboard/filter-bar'
import { SummaryCards }     from '@/components/dashboard/summary-cards'
import { RevenueChart }     from '@/components/dashboard/revenue-chart'
import { TopProductsChart } from '@/components/dashboard/top-products-chart'
import { AccountTypeChart } from '@/components/dashboard/account-type-chart'
import { SalesTable }       from '@/components/dashboard/sales-table'

export const metadata: Metadata = { title: 'Dashboard — Two Mountain Wholesale' }

type SP = Promise<{
  start?:        string | string[]
  end?:          string | string[]
  customers?:    string | string[]
  products?:     string | string[]
  account_type?: string | string[]
}>

function first(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v[0] : v
}

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

export default async function DashboardPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams

  const defaults  = getDefaultDateRange()
  const startDate = parseDate(first(sp.start), defaults.start)
  const endDate   = parseDate(first(sp.end),   defaults.end)

  const priorPeriod = getPriorPeriod(startDate, endDate)
  const priorYear   = getPriorYear(startDate, endDate)

  const rawAccountType = first(sp.account_type)
  const filters: DashboardFilters = {
    customerIds: asArray(sp.customers),
    productIds:  asArray(sp.products),
    accountType: rawAccountType === 'on_premise' || rawAccountType === 'off_premise'
      ? rawAccountType
      : 'all',
  }

  const supabase = createServerClient()

  const overallStart = toISODate(new Date(Math.min(priorPeriod.start.getTime(), priorYear.start.getTime())))
  const overallEnd   = toISODate(endDate)

  const [ordersResult, customersResult, productsResult] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        id, order_date,
        customers ( id, store_name, account_type ),
        order_line_items (
          quantity, unit_price,
          products ( id, name, vintage, volume_ml )
        )
      `)
      .gte('order_date', overallStart)
      .lte('order_date', overallEnd)
      .not('status', 'eq', 'cancelled'),
    supabase.from('customers').select('id, store_name, account_type').eq('active', true).order('store_name'),
    supabase.from('products').select('id, name').eq('active', true).order('name'),
  ])

  const allFlat = flattenOrders((ordersResult.data ?? []) as unknown as RawOrderRow[])

  const cStart  = toISODate(startDate)
  const cEnd    = toISODate(endDate)
  const pPStart = toISODate(priorPeriod.start)
  const pPEnd   = toISODate(priorPeriod.end)
  const pYStart = toISODate(priorYear.start)
  const pYEnd   = toISODate(priorYear.end)

  const inRange = (r: { order_date: string }, s: string, e: string) =>
    r.order_date >= s && r.order_date <= e

  const currentRows     = applyFilters(allFlat.filter((r) => inRange(r, cStart, cEnd)),   filters)
  const priorPeriodRows = applyFilters(allFlat.filter((r) => inRange(r, pPStart, pPEnd)), filters)
  const priorYearRows   = applyFilters(allFlat.filter((r) => inRange(r, pYStart, pYEnd)),  filters)

  const metrics       = computeMetrics(currentRows)
  const priorPMetrics = computeMetrics(priorPeriodRows)
  const priorYMetrics = computeMetrics(priorYearRows)

  const monthlyRevenue = computeMonthlyRevenue(currentRows)
  const topProducts    = computeTopProducts(currentRows)
  const byAccountType  = computeByAccountType(currentRows)
  const salesByProduct = computeSalesByProduct(currentRows)

  const allCustomers = (customersResult.data ?? []) as { id: string; store_name: string; account_type: string }[]
  const allProducts  = (productsResult.data ?? []) as { id: string; name: string }[]

  // Key forces FilterBar to remount (re-sync state) when URL params change
  const filterKey = [cStart, cEnd, ...filters.customerIds, ...filters.productIds, filters.accountType].join('|')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Sales Dashboard</h1>

      <FilterBar
        key={filterKey}
        customers={allCustomers}
        products={allProducts}
        initialStart={cStart}
        initialEnd={cEnd}
        initialCustomers={filters.customerIds}
        initialProducts={filters.productIds}
        initialAccountType={filters.accountType}
      />

      <SummaryCards
        metrics={metrics}
        priorPeriodMetrics={priorPMetrics}
        priorYearMetrics={priorYMetrics}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={monthlyRevenue} />
        </div>
        <div>
          <AccountTypeChart data={byAccountType} />
        </div>
      </div>

      <div className="mt-6">
        <TopProductsChart data={topProducts} />
      </div>

      <div className="mt-6">
        <SalesTable data={salesByProduct} />
      </div>
    </div>
  )
}
