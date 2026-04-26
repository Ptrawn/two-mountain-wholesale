'use client'

import { useState, useTransition, useActionState } from 'react'
import Link from 'next/link'
import { createOrGetInvoice, attachInvoiceScan } from '@/app/invoices/actions'
import type { AttachState } from '@/app/invoices/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceData {
  id:             string
  invoice_number: string
  invoice_date:   string
  attachment_url: string | null
}

interface InvoiceSectionProps {
  orderId: string
  invoice: InvoiceData | null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GenerateButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()
  const [genError, setGenError]      = useState<string | null>(null)

  function handleClick() {
    setGenError(null)
    startTransition(async () => {
      const result = await createOrGetInvoice(orderId)
      if (result.error) {
        setGenError(result.error)
        return
      }
      if (result.invoiceId) {
        window.location.href = `/api/invoices/${result.invoiceId}/pdf`
      }
    })
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">No invoice generated yet for this order.</p>
      {genError && <p className="mb-3 text-xs text-red-600">{genError}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
            </svg>
            Generate Invoice
          </>
        )}
      </button>
    </div>
  )
}

function AttachmentSection({
  invoice,
}: {
  invoice: InvoiceData
}) {
  const boundAction = attachInvoiceScan.bind(null, invoice.id)
  const [state, formAction, pending] = useActionState<AttachState, FormData>(boundAction, {})

  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Scanned Invoice
      </p>

      {invoice.attachment_url ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={invoice.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View attachment →
          </a>
          <span className="text-slate-300">·</span>
          <form action={formAction} className="inline-flex items-center gap-2">
            <label className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
              {pending ? 'Uploading…' : 'Replace'}
              <input
                type="file"
                name="file"
                accept="image/*,.pdf"
                className="sr-only"
                onChange={(e) => e.target.form?.requestSubmit()}
                disabled={pending}
              />
            </label>
            {state.error && <span className="text-xs text-red-500">{state.error}</span>}
          </form>
        </div>
      ) : (
        <form action={formAction}>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0L5.2 6.705a.75.75 0 1 0 1.09 1.03l2.96-3.135v8.65Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            {pending ? 'Uploading…' : 'Upload scanned invoice'}
            <input
              type="file"
              name="file"
              accept="image/*,.pdf"
              className="sr-only"
              onChange={(e) => e.target.form?.requestSubmit()}
              disabled={pending}
            />
          </label>
          {state.error && (
            <p className="mt-1.5 text-xs text-red-600">{state.error}</p>
          )}
        </form>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function InvoiceSection({ orderId, invoice }: InvoiceSectionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Invoice
      </h2>

      {!invoice ? (
        <GenerateButton orderId={orderId} />
      ) : (
        <div className="space-y-4">
          {/* Invoice info + download */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-bold text-slate-900">
                {invoice.invoice_number}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {new Date(invoice.invoice_date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
            <Link
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
              Download PDF
            </Link>
          </div>
          <AttachmentSection invoice={invoice} />
        </div>
      )}
    </div>
  )
}
