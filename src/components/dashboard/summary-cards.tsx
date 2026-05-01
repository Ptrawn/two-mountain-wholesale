import type { DashboardMetrics } from '@/lib/dashboard'

interface SummaryCardsProps {
  metrics:            DashboardMetrics
  priorPeriodMetrics: DashboardMetrics
  priorYearMetrics:   DashboardMetrics
}

export function SummaryCards({ metrics, priorPeriodMetrics, priorYearMetrics }: SummaryCardsProps) {
  const cards = [
    {
      label:  'Total Revenue',
      value:  fmtMoney(metrics.revenue),
      cur:    metrics.revenue,
      ppVal:  priorPeriodMetrics.revenue,
      pyVal:  priorYearMetrics.revenue,
      format: fmtMoney,
    },
    {
      label:  'Bottles Sold',
      value:  metrics.bottles.toLocaleString(),
      cur:    metrics.bottles,
      ppVal:  priorPeriodMetrics.bottles,
      pyVal:  priorYearMetrics.bottles,
      format: (n: number) => n.toLocaleString(),
    },
    {
      label:  'Orders',
      value:  metrics.orders.toLocaleString(),
      cur:    metrics.orders,
      ppVal:  priorPeriodMetrics.orders,
      pyVal:  priorYearMetrics.orders,
      format: (n: number) => n.toLocaleString(),
    },
    {
      label:  'Active Accounts',
      value:  metrics.activeAccounts.toLocaleString(),
      cur:    metrics.activeAccounts,
      ppVal:  priorPeriodMetrics.activeAccounts,
      pyVal:  priorYearMetrics.activeAccounts,
      format: (n: number) => n.toLocaleString(),
    },
  ]

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            <ComparisonRow label="vs prior period" current={card.cur} prior={card.ppVal} />
            <ComparisonRow label="vs prior year"   current={card.cur} prior={card.pyVal} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ComparisonRow({
  label,
  current,
  prior,
}: {
  label:   string
  current: number
  prior:   number
}) {
  if (prior === 0 && current === 0) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs text-slate-300">—</span>
      </div>
    )
  }

  if (prior === 0) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-medium text-emerald-600">new</span>
      </div>
    )
  }

  const pct  = ((current - prior) / prior) * 100
  const isUp = pct > 0.05
  const isDn = pct < -0.05

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-medium ${isUp ? 'text-emerald-600' : isDn ? 'text-red-500' : 'text-slate-400'}`}>
        {isUp ? '↑' : isDn ? '↓' : ''}
        {Math.abs(pct).toFixed(1)}%
      </span>
    </div>
  )
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
