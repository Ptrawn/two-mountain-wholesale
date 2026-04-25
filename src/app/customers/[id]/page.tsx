import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Customer } from '@/types/customer'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase
    .from('customers')
    .select('store_name')
    .eq('id', id)
    .single()
  return { title: data ? `${data.store_name} — Two Mountain Wholesale` : 'Customer' }
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (!customer) notFound()

  const c = customer as Customer

  const fullAddress = [c.address, c.city, c.state && c.zip ? `${c.state} ${c.zip}` : (c.state ?? c.zip)]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/customers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> Customers
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{c.store_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AccountTypeBadge type={c.account_type} />
              <StatusBadge active={c.active} />
            </div>
          </div>
          <Link
            href={`/customers/${c.id}/edit`}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {/* Contact & Location */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailCard title="Contact">
            <DetailRow label="Contact Name" value={c.contact_name} />
            <DetailRow label="Phone" value={c.phone} />
            <DetailRow label="Email" value={c.email} />
          </DetailCard>
          <DetailCard title="Location">
            <DetailRow label="Address" value={fullAddress || null} />
          </DetailCard>
        </div>

        {/* License */}
        <DetailCard title="License">
          <DetailRow label="Liquor License Number" value={c.liquor_license_number} />
        </DetailCard>

        {/* Order History placeholder */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Order History
          </h2>
          <p className="mt-2 text-sm text-slate-400">Order history will appear here.</p>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <dl className="space-y-2">{children}</dl>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">
        {value ?? <span className="text-slate-400">—</span>}
      </dd>
    </div>
  )
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

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
      Inactive
    </span>
  )
}
