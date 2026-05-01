'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ProductRevenue } from '@/lib/dashboard'

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function TopProductsChart({ data }: { data: ProductRevenue[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className="text-sm text-slate-400">No data for this period</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name:    d.vintage ? `${d.product_name} ${d.vintage}` : d.product_name,
    revenue: d.revenue,
    bottles: d.bottles,
  }))

  const rowHeight = 36
  const chartHeight = Math.max(220, chartData.length * rowHeight)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Top Products by Revenue</h2>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 72, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={fmtMoney}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            width={180}
          />
          <Tooltip
            formatter={(value) => [fmtMoney(Number(value)), 'Revenue']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}
          />
          <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
