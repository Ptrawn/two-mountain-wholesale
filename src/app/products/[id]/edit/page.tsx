import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Product } from '@/types/product'
import { ProductForm } from '@/components/products/product-form'
import { updateProduct } from '@/app/products/actions'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase.from('products').select('name').eq('id', id).single()
  return { title: data ? `Edit ${data.name} — Two Mountain Wholesale` : 'Edit Product' }
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  const p = product as Product

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/products/${p.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> {p.name}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
      </div>

      <ProductForm
        product={p}
        action={updateProduct}
        cancelHref={`/products/${p.id}`}
      />
    </div>
  )
}
