import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductForm } from '@/components/products/product-form'
import { createProduct } from '@/app/products/actions'

export const metadata: Metadata = { title: 'Add Product — Two Mountain Wholesale' }

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/products"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> Products
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add Product</h1>
      </div>

      <ProductForm action={createProduct} cancelHref="/products" />
    </div>
  )
}
