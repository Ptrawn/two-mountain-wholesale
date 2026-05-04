import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Reminders — Two Mountain Wholesale' }

// ── Types ────────────────────────────────────────────────────────────────────

type RawOrder    = { order_date: string; status: string }
type RawCustomer = { id: string; store_name: string; account_type: string; orders: RawOrder[] }

type ReminderStatus = 'red' | 'yellow' | 'green'

interface ReminderRow {
  id:            string
  store_name:    string
  account_type:  string
  lastOrderDate: string | null
  daysSince:     number | null
  cadence:       number
  isPersonal:    boolean
  status:        ReminderStatus
}

// ── Computation ──────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  const d   = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / 86400000)
}

function medianCadence(sortedDates: string[]): number | null {
  if (sortedDates.length < 3) return null
  const gaps: number[] = []
  for (let i = 1; i < sortedDates.length; i++) {
    const a = new Date(sortedDates[i - 1] + 'T00:00:00')
    const b = new Date(sortedDates[i]     + 'T00:00:00')
    gaps.push(Math.round((b.getTime() - a.getTime()) / 86400000))
  }
  gaps.sort((a, b) => a - b)
  const mid = Math.floor(gaps.length / 2)
  return gaps.length % 2 === 0
    ? Math.round((gaps[mid - 1] + gaps[mid]) / 2)
    : gaps[mid]
}

function buildRow(c: RawCustomer): ReminderRow {
  const validDates = c.orders
    .filter((o) => o.status !== 'cancelled')
    .map((o) => o.order_date)
    .sort()

  const lastOrderDate = validDates.length > 0 ? validDates[validDates.length - 1] : null
  const days          = lastOrderDate ? daysSince(lastOrderDate) : null
  const personal      = medianCadence(validDates)
  const cadence       = personal ?? 14
  const isPersonal    = personal !== null

  const status: ReminderStatus =
    days === null || days >= cadence ? 'red'
    : days >= cadence - 3            ? 'yellow'
    :                                  'green'

  return {
    id: c.id, store_name: c.store_name, account_type: c.account_type,
    lastOrderDate, daysSince: days, cadence, isPersonal, status,
  }
}

const STATUS_RANK: Record<ReminderStatus, number> = { red: 0, yellow: 1, green: 2 }

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function RemindersPage() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('customers')
    .select(`id, store_name, account_type, orders ( order_date, status )`)
    .eq('active', true)
    .order('store_name')

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load reminders: {error.message}
        </div>
      </div>
    )
  }

  const rows = ((data ?? []) as unknown as RawCustomer[])
    .map(buildRow)
    .sort((a, b) => {
      const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      if (byStatus !== 0) return byStatus
      // within same status: most overdue first
      return (b.daysSince ?? Infinity) - (a.daysSince ?? Infinity)
    })

  // Alert list: any customer who hasn't ordered in 14+ days (or never)
  const alerts = rows.filter((r) => r.daysSince === null || r.daysSince >= 14)

  const redCount    = rows.filter((r) => r.status === 'red').length
  const yellowCount = rows.filter((r) => r.status === 'yellow').length

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reorder Reminders</h1>
        <p className="mt-1 text-sm text-slate-500">
          {rows.length} active accounts
          {redCount    > 0 ? ` · ${redCount} overdue`    : ''}
          {yellowCount > 0 ? ` · ${yellowCount} due soon` : ''}
        </p>
      </div>

      {/* ── Alert banner ── */}
      {alerts.length > 0 && (
        <div className="mb-8 rounded-xl border border-red-300 bg-red-50 p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
            <span aria-hidden className="text-base">⚠</span>
            {alerts.length === 1
              ? '1 account has not ordered in 14+ days'
              : `${alerts.length} accounts have not ordered in 14+ days`}
          </p>
          <ul className="divide-y divide-red-200">
            {alerts.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <Link
                  href={`/customers/${r.id}`}
                  className="text-sm font-medium text-red-700 hover:underline"
                >
                  {r.store_name}
                </Link>
                <span className="shrink-0 text-sm text-red-600">
                  {r.daysSince !== null ? `${r.daysSince} days ago` : 'Never ordered'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Table ── */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">No active customers</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Order</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Days Since</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Cadence</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link href={`/customers/${r.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                        {r.store_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <AccountTypeBadge type={r.account_type} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {r.lastOrderDate ? fmtDate(r.lastOrderDate) : <span className="text-slate-400">Never</span>}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-700">
                      {r.daysSince !== null ? `${r.daysSince}` : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-500">
                      {r.cadence} days{r.isPersonal ? '' : ' (default)'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={r.status} daysSince={r.daysSince} cadence={r.cadence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 sm:hidden">
            {rows.map((r) => (
              <Link
                key={r.id}
                href={`/customers/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{r.store_name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {r.lastOrderDate
                      ? `Last order ${r.daysSince}d ago · ${r.cadence}d cadence${r.isPersonal ? '' : ' (default)'}`
                      : `Never ordered · ${r.cadence}d cadence (default)`}
                  </p>
                </div>
                <StatusDot status={r.status} />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function AccountTypeBadge({ type }: { type: string }) {
  if (type === 'on_premise') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        On-Premise
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      Off-Premise
    </span>
  )
}

function StatusBadge({
  status,
  daysSince,
  cadence,
}: {
  status:    ReminderStatus
  daysSince: number | null
  cadence:   number
}) {
  if (status === 'red') {
    const overdue = daysSince !== null ? daysSince - cadence : null
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {daysSince === null ? 'Never ordered' : overdue !== null && overdue > 0 ? `${overdue}d overdue` : 'Overdue'}
      </span>
    )
  }
  if (status === 'yellow') {
    const daysLeft = cadence - (daysSince ?? 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Due in {daysLeft}d
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      On track
    </span>
  )
}

function StatusDot({ status }: { status: ReminderStatus }) {
  const map: Record<ReminderStatus, string> = {
    red:    'bg-red-500',
    yellow: 'bg-amber-400',
    green:  'bg-emerald-500',
  }
  return <span className={`h-3 w-3 shrink-0 rounded-full ${map[status]}`} />
}
