'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/types/product'
import { VOLUME_OPTIONS } from '@/types/product'
import type { FormState } from '@/app/products/actions'

interface ProductFormProps {
  product?: Product
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  cancelHref: string
}

export function ProductForm({ product, action, cancelHref }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {})
  const [isActive, setIsActive] = useState(product?.active ?? true)

  return (
    <form action={formAction} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      {/* General error */}
      {state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Product Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Product Information
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={product?.name ?? ''}
              className={inputClass(!!state.errors?.name)}
              placeholder="2022 Cabernet Sauvignon"
            />
            {state.errors?.name && <FieldError msg={state.errors.name} />}
          </div>

          {/* Vintage / Volume / ABV */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="vintage" className="block text-sm font-medium text-slate-700">
                Vintage
              </label>
              <input
                id="vintage"
                name="vintage"
                type="number"
                min={1900}
                max={2100}
                defaultValue={product?.vintage ?? ''}
                className={inputClass(!!state.errors?.vintage)}
                placeholder="2022"
              />
              {state.errors?.vintage && <FieldError msg={state.errors.vintage} />}
            </div>

            <div>
              <label htmlFor="volume_ml" className="block text-sm font-medium text-slate-700">
                Volume <span className="text-red-500">*</span>
              </label>
              <select
                id="volume_ml"
                name="volume_ml"
                defaultValue={product?.volume_ml != null ? String(product.volume_ml) : ''}
                className={inputClass(!!state.errors?.volume_ml)}
              >
                <option value="" disabled>Select volume…</option>
                {VOLUME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={String(opt.value)}>
                    {opt.label} ({opt.name})
                  </option>
                ))}
              </select>
              {state.errors?.volume_ml && <FieldError msg={state.errors.volume_ml} />}
            </div>

            <div>
              <label htmlFor="abv_category" className="block text-sm font-medium text-slate-700">
                ABV Category <span className="text-red-500">*</span>
              </label>
              <select
                id="abv_category"
                name="abv_category"
                defaultValue={product?.abv_category ?? ''}
                className={inputClass(!!state.errors?.abv_category)}
              >
                <option value="" disabled>Select category…</option>
                <option value="over_14">Over 14%</option>
                <option value="under_14">Under 14%</option>
              </select>
              {state.errors?.abv_category && <FieldError msg={state.errors.abv_category} />}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 pt-1">
            <input type="hidden" name="active" value={isActive ? 'on' : ''} />
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {isActive ? 'Active product' : 'Inactive product'}
            </span>
          </div>
        </div>
      </section>

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link
          href={cancelHref}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-w-[120px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save Product'}
        </button>
      </div>
    </form>
  )
}

function inputClass(hasError: boolean) {
  return [
    'mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900',
    'placeholder:text-slate-400 outline-none transition-colors',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    hasError
      ? 'border-red-400 bg-red-50'
      : 'border-slate-300 bg-white hover:border-slate-400',
  ].join(' ')
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}
