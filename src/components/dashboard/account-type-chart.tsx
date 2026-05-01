'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { AccountTypeRevenue } from '@/lib/dashboard'

const COLORS = ['#2563eb', '#f59e0b']

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function AccountTypeChart({ data }: { data: AccountTypeRevenue[] }) {
  const hasData = data.some((d) => d.revenue > 0)

  if (!hasData) {
    return (
      <div className="flex h-full min-h-[288px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className="text-sm text-slate-400">No data for this period</p>
      </div>
    )
  }

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Revenue by Account Type</h2>
      <ResponsiveContainer width="100%" height={256}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="name"
            cx="50%"
            cy="42%"
            outerRadius={90}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [fmtMoney(Number(value)), 'Revenue']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}
          />
          <Legend
            iconSize={10}
            formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
