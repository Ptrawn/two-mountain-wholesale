export const runtime = 'nodejs'

import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createServerClient } from '@/lib/supabase/server'
import { InvoiceDocument } from '@/components/invoices/invoice-document'
import type { InvoiceDocumentData } from '@/components/invoices/invoice-document'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, invoice_date,
      orders (
        customers ( store_name, address, city, state, zip, liquor_license_number ),
        order_line_items (
          quantity, unit_price,
          products ( name, vintage, volume_ml, abv_category )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return new Response('Invoice not found', { status: 404 })
  }

  type CustomerRow = {
    store_name: string; address: string | null; city: string | null
    state: string | null; zip: string | null; liquor_license_number: string | null
  }
  type ProductRow = { name: string; vintage: number | null; volume_ml: number | null; abv_category: string }
  type LineRow    = { quantity: number; unit_price: number; products: ProductRow | null }
  type OrderRow   = { customers: CustomerRow | null; order_line_items: LineRow[] }

  const order    = data.orders as unknown as OrderRow | null
  const customer = order?.customers

  if (!order || !customer) {
    return new Response('Order data missing', { status: 404 })
  }

  const invoiceData: InvoiceDocumentData = {
    invoiceNumber: data.invoice_number,
    invoiceDate:   data.invoice_date,
    customer,
    lineItems: (order.order_line_items ?? []).map((li) => ({
      productName:  li.products?.name         ?? 'Unknown Product',
      vintage:      li.products?.vintage       ?? null,
      volume_ml:    li.products?.volume_ml     ?? null,
      abv_category: li.products?.abv_category  ?? 'under_14',
      quantity:     li.quantity,
      unit_price:   Number(li.unit_price),
    })),
  }

  const element = React.createElement(InvoiceDocument, { data: invoiceData }) as React.ReactElement<DocumentProps>
  const buffer  = await renderToBuffer(element)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${data.invoice_number}.pdf"`,
      'Cache-Control':       'no-store',
    },
  })
}
