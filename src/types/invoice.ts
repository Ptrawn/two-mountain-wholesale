export interface Invoice {
  id: string
  order_id: string
  invoice_number: string
  invoice_date: string
  attachment_url: string | null
  created_at: string
}
