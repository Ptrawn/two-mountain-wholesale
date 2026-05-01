'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { MonthlyRevenue } from '@/lib/dashboard'

function fmtMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className="text-sm text-slate-400">No data for this period</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({ ...d, label: fmtMonth(d.month) }))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Revenue Over Time</h2>
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={chartData} margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={fmtMoney}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value) => [fmtMoney(Number(value)), 'Revenue']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
