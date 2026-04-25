'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Customer } from '@/types/customer'
import type { Product } from '@/types/product'
import { VOLUME_OPTIONS } from '@/types/product'
import { ORDER_STATUSES } from '@/types/order'
import type { FormState } from '@/app/orders/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  key: number
  product_id: string
  quantity: number
  unit_price: number
}

interface ComboOption {
  value: string
  label: string
  sub?: string
}

// ─── Combobox ─────────────────────────────────────────────────────────────────

function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  hasError,
  name,
}: {
  options: ComboOption[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hasError?: boolean
  name?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef    = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const filtered  = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function openDropdown() {
    setOpen(true)
    setTimeout(() => searchRef.current?.focus(), 0)
  }

  return (
    <div ref={containerRef} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={`${inputCls(!!hasError)} flex w-full items-center justify-between text-left`}
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected?.label ?? placeholder}
        </span>
        <svg className="ml-2 h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No results</li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.value}
                  onMouseDown={() => { onChange(o.value); setOpen(false); setQuery('') }}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${
                    o.value === value ? 'font-medium text-blue-600' : 'text-slate-900'
                  }`}
                >
                  {o.label}
                  {o.sub && <span className="ml-1.5 text-xs text-slate-400">{o.sub}</span>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface OrderFormProps {
  customers: Pick<Customer, 'id' | 'store_name' | 'account_type'>[]
  products:  Pick<Product,  'id' | 'name' | 'volume_ml' | 'abv_category'>[]
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  today: string
}

export function OrderForm({ customers, products, action, today }: OrderFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  const [customerId, setCustomerId] = useState('')
  const [lineItems, setLineItems]   = useState<LineItem[]>([
    { key: 0, product_id: '', quantity: 1, unit_price: 0 },
  ])
  const nextKey = useRef(1)

  const customerOptions: ComboOption[] = customers.map((c) => ({ value: c.id, label: c.store_name }))
  const productOptions:  ComboOption[] = products.map((p) => {
    const vol = VOLUME_OPTIONS.find((o) => o.value === p.volume_ml)
    return { value: p.id, label: p.name, sub: vol?.label ?? (p.volume_ml ? `${p.volume_ml} ml` : undefined) }
  })

  function addItem() {
    setLineItems((prev) => [
      ...prev,
      { key: nextKey.current++, product_id: '', quantity: 1, unit_price: 0 },
    ])
  }

  function removeItem(key: number) {
    setLineItems((prev) => prev.filter((item) => item.key !== key))
  }

  function updateItem(key: number, field: keyof Omit<LineItem, 'key'>, val: string | number) {
    setLineItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: val } : item)),
    )
  }

  const orderTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  return (
    <form action={formAction} className="space-y-6">
      {/* Serialized line items */}
      <input type="hidden" name="line_items" value={JSON.stringify(
        lineItems.map(({ product_id, quantity, unit_price }) => ({ product_id, quantity, unit_price }))
      )} />

      {/* General error */}
      {state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Order Details */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Order Details
        </h2>

        <div className="space-y-4">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Customer <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <Combobox
                options={customerOptions}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Select customer…"
                hasError={!!state.errors?.customer_id}
                name="customer_id"
              />
            </div>
            {state.errors?.customer_id && <FieldError msg={state.errors.customer_id} />}
          </div>

          {/* Date + Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="order_date" className="block text-sm font-medium text-slate-700">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                id="order_date"
                name="order_date"
                type="date"
                defaultValue={today}
                className={inputCls(!!state.errors?.order_date)}
              />
              {state.errors?.order_date && <FieldError msg={state.errors.order_date} />}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                defaultValue="pending"
                className={inputCls(!!state.errors?.status)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {state.errors?.status && <FieldError msg={state.errors.status} />}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Optional notes…"
              className={inputCls(false) + ' resize-none'}
            />
          </div>
        </div>
      </section>

      {/* Line Items */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Line Items
          </h2>
          {state.errors?.line_items && <FieldError msg={state.errors.line_items} />}
        </div>

        <div className="space-y-3">
          {lineItems.map((item) => (
            <div key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              {/* Product selector row */}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <Combobox
                    options={productOptions}
                    value={item.product_id}
                    onChange={(v) => updateItem(item.key, 'product_id', v)}
                    placeholder="Select product…"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  disabled={lineItems.length === 1}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Remove line item"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>

              {/* Qty + Price + Total row */}
              <div className="mt-2 flex items-end gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    className={`${inputCls(false)} w-16 text-center`}
                  />
                </div>
                <span className="mb-2 text-slate-400">×</span>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500">Unit Price</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unit_price === 0 ? '' : item.unit_price}
                      placeholder="0.00"
                      onChange={(e) => updateItem(item.key, 'unit_price', parseFloat(e.target.value) || 0)}
                      className={`${inputCls(false)} pl-7`}
                    />
                  </div>
                </div>
                <div className="mb-2 shrink-0 text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {fmtMoney(item.quantity * item.unit_price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add Line Item
        </button>

        {/* Order total */}
        <div className="mt-4 flex items-center justify-end border-t border-slate-200 pt-4">
          <span className="text-sm font-medium text-slate-500">Order Total</span>
          <span className="ml-4 text-lg font-bold text-slate-900">{fmtMoney(orderTotal)}</span>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link
          href="/orders"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-w-[130px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save Order'}
        </button>
      </div>
    </form>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    'mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900',
    'placeholder:text-slate-400 outline-none transition-colors',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    hasError
      ? 'border-red-400 bg-red-50'
      : 'border-slate-300 bg-white hover:border-slate-400',
  ].join(' ')
}

function fmtMoney(n: number) {
  return '$' + n.toFixed(2)
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}
