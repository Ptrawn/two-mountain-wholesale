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
  return {
    store_name:            str('store_name') ?? '',
    contact_name:          str('contact_name'),
    phone:                 str('phone'),
    email:                 str('email'),
    address:               str('address'),
    city:                  str('city'),
    state:                 str('state'),
    zip:                   str('zip'),
    liquor_license_number: str('liquor_license_number'),
    account_type:          str('account_type') as 'on_premise' | 'off_premise',
    active:                formData.get('active') === 'on',
  }
}

function validate(fields: ReturnType<typeof extractFields>): Record<string, string> | null {
  const errors: Record<string, string> = {}
  if (!fields.store_name) errors.store_name = 'Store name is required.'
  if (!fields.account_type || !['on_premise', 'off_premise'].includes(fields.account_type)) {
    errors.account_type = 'Please select an account type.'
  }
  return Object.keys(errors).length ? errors : null
}

export async function createCustomer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = extractFields(formData)
  const errors = validate(fields)
  if (errors) return { errors }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('customers')
    .insert(fields)
    .select('id')
    .single()

  if (error) return { message: `Could not save customer: ${error.message}` }

  revalidatePath('/customers')
  redirect(`/customers/${data.id}`)
}

export async function updateCustomer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = (formData.get('id') as string | null)?.trim()
  if (!id) return { message: 'Missing customer ID.' }

  const fields = extractFields(formData)
  const errors = validate(fields)
  if (errors) return { errors }

  const supabase = createServerClient()
  const { error } = await supabase.from('customers').update(fields).eq('id', id)

  if (error) return { message: `Could not update customer: ${error.message}` }

  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
  redirect(`/customers/${id}`)
}
