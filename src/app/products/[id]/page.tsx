import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Product } from '@/types/product'
import { VOLUME_OPTIONS } from '@/types/product'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase.from('products').select('name').eq('id', id).single()
  return { title: data ? `${data.name} — Two Mountain Wholesale` : 'Product' }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  const p = product as Product

  const volumeOption = VOLUME_OPTIONS.find((o) => o.value === p.volume_ml)
  const volumeLabel  = volumeOption ? `${volumeOption.label} (${volumeOption.name})` : (p.volume_ml ? `${p.volume_ml} ml` : null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/products"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> Products
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{p.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AbvBadge category={p.abv_category} />
              <StatusBadge active={p.active} />
            </div>
          </div>
          <Link
            href={`/products/${p.id}/edit`}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {/* Details card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Product Details
          </h2>
          <dl className="space-y-2">
            <DetailRow label="Vintage"      value={p.vintage ? String(p.vintage) : null} />
            <DetailRow label="Volume"       value={volumeLabel} />
            <DetailRow label="ABV Category" value={p.abv_category === 'over_14' ? 'Over 14%' : 'Under 14%'} />
          </dl>
        </div>

        {/* Sales history placeholder */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sales History
          </h2>
          <p className="mt-2 text-sm text-slate-400">Sales history will appear here.</p>
        </div>
      </div>
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

function AbvBadge({ category }: { category: string }) {
  if (category === 'over_14') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
        Over 14%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
      Under 14%
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
