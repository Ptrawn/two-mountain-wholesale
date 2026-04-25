'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import type { Customer } from '@/types/customer'
import type { FormState } from '@/app/customers/actions'

interface CustomerFormProps {
  customer?: Customer
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  cancelHref: string
}

export function CustomerForm({ customer, action, cancelHref }: CustomerFormProps) {
  const [state, formAction, pending] = useActionState(action, {})
  const [isActive, setIsActive] = useState(customer?.active ?? true)

  return (
    <form action={formAction} className="space-y-6">
      {customer && <input type="hidden" name="id" value={customer.id} />}

      {/* General error */}
      {state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Store Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Store Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="store_name" className="block text-sm font-medium text-slate-700">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              id="store_name"
              name="store_name"
              type="text"
              defaultValue={customer?.store_name ?? ''}
              autoComplete="organization"
              className={inputClass(!!state.errors?.store_name)}
              placeholder="ABC Wine & Spirits"
            />
            {state.errors?.store_name && <FieldError msg={state.errors.store_name} />}
          </div>
          <div>
            <label htmlFor="account_type" className="block text-sm font-medium text-slate-700">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              id="account_type"
              name="account_type"
              defaultValue={customer?.account_type ?? ''}
              className={inputClass(!!state.errors?.account_type)}
            >
              <option value="" disabled>Select type…</option>
              <option value="on_premise">On-Premise</option>
              <option value="off_premise">Off-Premise</option>
            </select>
            {state.errors?.account_type && <FieldError msg={state.errors.account_type} />}
          </div>
        </div>

        {/* Active toggle */}
        <div className="mt-4 flex items-center gap-3">
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
            {isActive ? 'Active account' : 'Inactive account'}
          </span>
        </div>
      </section>

      {/* Contact Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium text-slate-700">
              Contact Name
            </label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              defaultValue={customer?.contact_name ?? ''}
              autoComplete="name"
              className={inputClass(false)}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={customer?.phone ?? ''}
              autoComplete="tel"
              className={inputClass(false)}
              placeholder="(509) 555-0100"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={customer?.email ?? ''}
              autoComplete="email"
              className={inputClass(false)}
              placeholder="jane@store.com"
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Location
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">
              Street Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              defaultValue={customer?.address ?? ''}
              autoComplete="street-address"
              className={inputClass(false)}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                defaultValue={customer?.city ?? ''}
                autoComplete="address-level2"
                className={inputClass(false)}
                placeholder="Yakima"
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="state" className="block text-sm font-medium text-slate-700">
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                defaultValue={customer?.state ?? ''}
                autoComplete="address-level1"
                className={inputClass(false)}
                placeholder="WA"
                maxLength={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="zip" className="block text-sm font-medium text-slate-700">
                ZIP Code
              </label>
              <input
                id="zip"
                name="zip"
                type="text"
                defaultValue={customer?.zip ?? ''}
                autoComplete="postal-code"
                className={inputClass(false)}
                placeholder="98901"
              />
            </div>
          </div>
        </div>
      </section>

      {/* License */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          License
        </h2>
        <div className="max-w-sm">
          <label htmlFor="liquor_license_number" className="block text-sm font-medium text-slate-700">
            Liquor License Number
          </label>
          <input
            id="liquor_license_number"
            name="liquor_license_number"
            type="text"
            defaultValue={customer?.liquor_license_number ?? ''}
            className={inputClass(false)}
            placeholder="WA-1234567"
          />
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
          {pending ? 'Saving…' : 'Save Customer'}
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
