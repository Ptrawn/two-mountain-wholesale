'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type FormState = {
  errors?: Record<string, string>
  message?: string
}

function extractFields(formData: FormData) {
  const str = (key: string) => (formData.get(key) as string | null)?.trim() || null
  const vintageStr = str('vintage')
  const volumeStr  = str('volume_ml')
  return {
    name:         str('name') ?? '',
    vintage:      vintageStr ? parseInt(vintageStr, 10) : null,
    volume_ml:    volumeStr  ? parseInt(volumeStr, 10)  : null,
    abv_category: str('abv_category') as 'over_14' | 'under_14',
    active:       formData.get('active') === 'on',
  }
}

function validate(fields: ReturnType<typeof extractFields>): Record<string, string> | null {
  const errors: Record<string, string> = {}
  if (!fields.name) errors.name = 'Product name is required.'
  if (!fields.volume_ml) errors.volume_ml = 'Please select a volume.'
  if (!fields.abv_category || !['over_14', 'under_14'].includes(fields.abv_category)) {
    errors.abv_category = 'Please select an ABV category.'
  }
  if (fields.vintage !== null && (isNaN(fields.vintage) || fields.vintage < 1900 || fields.vintage > 2100)) {
    errors.vintage = 'Vintage must be a year between 1900 and 2100.'
  }
  return Object.keys(errors).length ? errors : null
}

export async function createProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = extractFields(formData)
  const errors = validate(fields)
  if (errors) return { errors }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .insert(fields)
    .select('id')
    .single()

  if (error) return { message: `Could not save product: ${error.message}` }

  revalidatePath('/products')
  redirect(`/products/${data.id}`)
}

export async function updateProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = (formData.get('id') as string | null)?.trim()
  if (!id) return { message: 'Missing product ID.' }

  const fields = extractFields(formData)
  const errors = validate(fields)
  if (errors) return { errors }

  const supabase = createServerClient()
  const { error } = await supabase.from('products').update(fields).eq('id', id)

  if (error) return { message: `Could not update product: ${error.message}` }

  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  redirect(`/products/${id}`)
}
