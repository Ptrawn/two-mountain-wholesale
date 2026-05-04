import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ProductSearch } from '@/components/products/product-search'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Products — Two Mountain Wholesale' }

export default async function ProductsPage() {
  const supabase = createServerClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, vintage, volume_ml, abv_category, active')
    .order('name')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load products: {error.message}
        </div>
      )}

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

      {!error && products && products.length > 0 && (
        <ProductSearch products={products} />
      )}
    </div>
  )
}
