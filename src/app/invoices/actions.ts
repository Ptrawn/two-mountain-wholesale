'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AttachState = { error?: string; success?: boolean }

export async function createOrGetInvoice(
  orderId: string,
): Promise<{ invoiceId?: string; error?: string }> {
  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return { invoiceId: existing.id }

  // Generate next sequential invoice number
  const { data: last } = await supabase
    .from('invoices')
    .select('invoice_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let next = 1
  if (last?.invoice_number) {
    const match = last.invoice_number.match(/(\d+)$/)
    if (match) next = parseInt(match[1]) + 1
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      order_id:       orderId,
      invoice_number: `INV-${String(next).padStart(4, '0')}`,
      invoice_date:   new Date().toISOString().split('T')[0],
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/invoices')
  return { invoiceId: invoice.id }
}

export async function attachInvoiceScan(
  invoiceId: string,
  _prev: AttachState,
  formData: FormData,
): Promise<AttachState> {
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'No file selected.' }
  if (file.size > 10 * 1024 * 1024) return { error: 'File must be under 10 MB.' }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.type)) {
    return { error: 'Must be a JPEG, PNG, WebP, or PDF.' }
  }

  const supabase = createServerClient()
  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${invoiceId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('invoice-attachments')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('invoice-attachments')
    .getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ attachment_url: publicUrl })
    .eq('id', invoiceId)

  if (updateError) return { error: updateError.message }

  const { data: inv } = await supabase
    .from('invoices')
    .select('order_id')
    .eq('id', invoiceId)
    .single()

  if (inv) revalidatePath(`/orders/${inv.order_id}`)
  revalidatePath('/invoices')
  return { success: true }
}
