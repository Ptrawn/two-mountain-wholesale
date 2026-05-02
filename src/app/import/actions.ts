'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ImportRow = {
  date:           string   // ISO date yyyy-mm-dd
  store:          string
  vintage:        number | null
  product:        string
  quantity:       number
  volume_ml:      number
  unit_price:     number
  receipt_number: string
  account_type:   'on_premise' | 'off_premise'
}

export type PreviewResult = {
  newCustomers:  string[]
  newProducts:   string[]
  duplicates:    string[]
  toImport:      number
  error?:        string
}

export type ImportStepResult = {
  count:  number
  error?: string
}

export type ImportOrdersResult = {
  inserted: number
  skipped:  number
  error?:   string
}

// ── Step 0: Preview ───────────────────────────────────────────────────────────

export async function previewImport(rows: ImportRow[]): Promise<PreviewResult> {
  if (rows.length === 0) return { newCustomers: [], newProducts: [], duplicates: [], toImport: 0 }

  const supabase = createServerClient()

  const storeNames     = [...new Set(rows.map((r) => r.store))]
  const receiptNumbers = [...new Set(rows.map((r) => r.receipt_number))]

  const [customersRes, productsRes, invoicesRes] = await Promise.all([
    supabase.from('customers').select('store_name').in('store_name', storeNames),
    supabase.from('products').select('name, vintage, volume_ml'),
    supabase.from('invoices').select('invoice_number').in('invoice_number', receiptNumbers),
  ])

  if (customersRes.error) return { newCustomers: [], newProducts: [], duplicates: [], toImport: 0, error: customersRes.error.message }
  if (productsRes.error)  return { newCustomers: [], newProducts: [], duplicates: [], toImport: 0, error: productsRes.error.message }
  if (invoicesRes.error)  return { newCustomers: [], newProducts: [], duplicates: [], toImport: 0, error: invoicesRes.error.message }

  const existingCustomers = new Set((customersRes.data ?? []).map((c) => c.store_name))
  const existingProducts  = new Set(
    (productsRes.data ?? []).map((p) => `${p.name}|${p.vintage ?? ''}|${p.volume_ml ?? ''}`)
  )
  const duplicateReceipts = new Set((invoicesRes.data ?? []).map((i) => i.invoice_number))

  const newCustomers = [...new Set(
    rows.filter((r) => !existingCustomers.has(r.store)).map((r) => r.store)
  )]

  const newProducts = [...new Set(
    rows
      .filter((r) => !existingProducts.has(`${r.product}|${r.vintage ?? ''}|${r.volume_ml}`))
      .map((r) => `${r.vintage ? r.vintage + ' ' : ''}${r.product} (${r.volume_ml}ml)`)
  )]

  const duplicates = rows
    .filter((r) => duplicateReceipts.has(r.receipt_number))
    .map((r) => r.receipt_number)
    .filter((v, i, a) => a.indexOf(v) === i)

  const toImport = rows.filter((r) => !duplicateReceipts.has(r.receipt_number)).length

  return { newCustomers, newProducts, duplicates, toImport }
}

// ── Step 1: Import customers ──────────────────────────────────────────────────

export async function importCustomers(rows: ImportRow[]): Promise<ImportStepResult> {
  const supabase = createServerClient()

  const storeNames = [...new Set(rows.map((r) => r.store))]
  const { data: existing, error: fetchErr } = await supabase
    .from('customers')
    .select('store_name')
    .in('store_name', storeNames)

  if (fetchErr) return { count: 0, error: fetchErr.message }

  const existingSet = new Set((existing ?? []).map((c) => c.store_name))

  // Build one record per unique new store name, using first row's account_type
  const toInsert: { store_name: string; account_type: string }[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    if (!existingSet.has(row.store) && !seen.has(row.store)) {
      seen.add(row.store)
      toInsert.push({ store_name: row.store, account_type: row.account_type })
    }
  }

  if (toInsert.length === 0) return { count: 0 }

  const { error } = await supabase.from('customers').insert(toInsert)
  if (error) return { count: 0, error: error.message }

  revalidatePath('/customers')
  return { count: toInsert.length }
}

// ── Step 2: Import products ───────────────────────────────────────────────────

export async function importProducts(rows: ImportRow[]): Promise<ImportStepResult> {
  const supabase = createServerClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('products')
    .select('name, vintage, volume_ml')

  if (fetchErr) return { count: 0, error: fetchErr.message }

  const existingSet = new Set(
    (existing ?? []).map((p) => `${p.name}|${p.vintage ?? ''}|${p.volume_ml ?? ''}`)
  )

  const toInsert: { name: string; vintage: number | null; volume_ml: number; abv_category: string; active: boolean }[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${row.product}|${row.vintage ?? ''}|${row.volume_ml}`
    if (!existingSet.has(key) && !seen.has(key)) {
      seen.add(key)
      toInsert.push({
        name:         row.product,
        vintage:      row.vintage,
        volume_ml:    row.volume_ml,
        abv_category: 'under_14',  // default; user can update later
        active:       true,
      })
    }
  }

  if (toInsert.length === 0) return { count: 0 }

  const { error } = await supabase.from('products').insert(toInsert)
  if (error) return { count: 0, error: error.message }

  revalidatePath('/products')
  return { count: toInsert.length }
}

// ── Step 3: Import orders ─────────────────────────────────────────────────────

export async function importOrders(rows: ImportRow[]): Promise<ImportOrdersResult> {
  const supabase = createServerClient()

  // Fetch all customers + products + existing invoices in one go
  const receiptNumbers = [...new Set(rows.map((r) => r.receipt_number))]

  const [customersRes, productsRes, existingInvRes, lastInvRes] = await Promise.all([
    supabase.from('customers').select('id, store_name'),
    supabase.from('products').select('id, name, vintage, volume_ml'),
    supabase.from('invoices').select('invoice_number').in('invoice_number', receiptNumbers),
    supabase.from('invoices').select('invoice_number').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (customersRes.error) return { inserted: 0, skipped: 0, error: customersRes.error.message }
  if (productsRes.error)  return { inserted: 0, skipped: 0, error: productsRes.error.message }
  if (existingInvRes.error) return { inserted: 0, skipped: 0, error: existingInvRes.error.message }

  const customerMap = new Map((customersRes.data ?? []).map((c) => [c.store_name, c.id]))
  const productMap  = new Map(
    (productsRes.data ?? []).map((p) => [`${p.name}|${p.vintage ?? ''}|${p.volume_ml ?? ''}`, p.id])
  )
  const duplicateSet = new Set((existingInvRes.data ?? []).map((i) => i.invoice_number))

  // Next invoice number
  let nextInvNum = 1
  if (lastInvRes.data?.invoice_number) {
    const match = lastInvRes.data.invoice_number.match(/(\d+)$/)
    if (match) nextInvNum = parseInt(match[1]) + 1
  }

  // Group rows by receipt number (one order per receipt)
  const byReceipt = new Map<string, ImportRow[]>()
  for (const row of rows) {
    if (duplicateSet.has(row.receipt_number)) continue
    const group = byReceipt.get(row.receipt_number) ?? []
    group.push(row)
    byReceipt.set(row.receipt_number, group)
  }

  const skipped = rows.filter((r) => duplicateSet.has(r.receipt_number)).length

  if (byReceipt.size === 0) return { inserted: 0, skipped }

  const receipts = [...byReceipt.entries()]
  const CONCURRENT = 20
  let inserted = 0

  for (let i = 0; i < receipts.length; i += CONCURRENT) {
    const batch = receipts.slice(i, i + CONCURRENT)
    const results = await Promise.all(
      batch.map(async ([receipt, group]) => {
        const firstRow   = group[0]
        const customerId = customerMap.get(firstRow.store)
        if (!customerId) return { ok: false, error: `Customer not found: ${firstRow.store}` }

        // Insert order
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .insert({
            customer_id: customerId,
            order_date:  firstRow.date,
            status:      'delivered',
            notes:       null,
          })
          .select('id')
          .single()

        if (orderErr) return { ok: false, error: orderErr.message }

        // Insert line items
        const lineItems = group.map((row) => {
          const productId = productMap.get(`${row.product}|${row.vintage ?? ''}|${row.volume_ml}`)
          return {
            order_id:   order.id,
            product_id: productId ?? null,
            quantity:   row.quantity,
            unit_price: row.unit_price,
          }
        }).filter((li) => li.product_id !== null)

        if (lineItems.length > 0) {
          const { error: liErr } = await supabase.from('order_line_items').insert(lineItems)
          if (liErr) return { ok: false, error: liErr.message }
        }

        // Insert invoice
        const invNum = `INV-${String(nextInvNum + i + batch.indexOf(batch.find(([r]) => r === receipt)!)).padStart(4, '0')}`
        const { error: invErr } = await supabase.from('invoices').insert({
          order_id:       order.id,
          invoice_number: receipt,
          invoice_date:   firstRow.date,
        })

        if (invErr) return { ok: false, error: invErr.message }

        return { ok: true }
      })
    )

    const errors = results.filter((r) => !r.ok).map((r) => (r as { ok: false; error: string }).error)
    if (errors.length > 0) return { inserted, skipped, error: errors[0] }

    inserted += batch.length
  }

  revalidatePath('/orders')
  revalidatePath('/invoices')
  revalidatePath('/dashboard')

  return { inserted, skipped }
}
