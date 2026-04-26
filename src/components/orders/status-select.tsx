'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatus } from '@/app/orders/actions'
import { ORDER_STATUSES } from '@/types/order'
import type { OrderStatus } from '@/types/order'

const statusStyles: Record<OrderStatus, string> = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200 focus:ring-amber-300',
  confirmed: 'bg-sky-100 text-sky-700 border-sky-200 focus:ring-sky-300',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200 focus:ring-emerald-300',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200 focus:ring-slate-300',
}

export function StatusSelect({
  orderId,
  initialStatus,
}: {
  orderId: string
  initialStatus: OrderStatus
}) {
  const [status, setStatus]       = useState(initialStatus)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OrderStatus
    const prev = status
    setStatus(next)
    setSaveError(null)

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next)
      if (result?.error) {
        setStatus(prev)
        setSaveError(result.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium outline-none transition-colors focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ${statusStyles[status]}`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-slate-400">Saving…</span>}
      {saveError && !isPending && <span className="text-xs text-red-500">{saveError}</span>}
    </div>
  )
}
