import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Product } from '@/types/product'
import { VOLUME_OPTIONS } from '@/types/product'

export const metadata: Metadata = { title: 'Products — Two Mountain Wholesale' }

function formatVolume(ml: number | null): string {
  if (!ml) return '—'
  return VOLUME_OPTIONS.find((o) => o.value === ml)?.label ?? `${ml} ml`
}

export default async function ProductsPage() {
  const supabase = createServerClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, vintage, volume_ml, abv_category, active')
    .order('name')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          {products && (
            <p className="mt-1 text-sm text-slate-500">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>
        <Link
          href="/products/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <span aria-hidden>+</span> Add Product
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load products: {error.message}
        </div>
      )}

      {/* Empty state */}
      {!error && products?.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-slate-900">No products yet</p>
          <p className="mt-1 text-sm text-slate-500">Add the wines you sell to get started.</p>
          <Link
            href="/products/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <span aria-hidden>+</span> Add Product
          </Link>
        </div>
      )}

      {/* Table */}
      {!error && products && products.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">
                  Vintage
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell sm:px-6">
                  Volume
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  ABV
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(products as Pick<Product, 'id' | 'name' | 'vintage' | 'volume_ml' | 'abv_category' | 'active'>[]).map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4 sm:px-6">
                    <Link
                      href={`/products/${p.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell sm:px-6">
                    {p.vintage ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell sm:px-6">
                    {formatVolume(p.volume_ml)}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <AbvBadge category={p.abv_category} />
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <StatusBadge active={p.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
