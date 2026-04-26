import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { VOLUME_OPTIONS } from '@/types/product'

export interface InvoiceDocumentData {
  invoiceNumber: string
  invoiceDate:   string
  customer: {
    store_name:            string
    address:               string | null
    city:                  string | null
    state:                 string | null
    zip:                   string | null
    liquor_license_number: string | null
  }
  lineItems: Array<{
    productName:  string
    vintage:      number | null
    volume_ml:    number | null
    abv_category: string
    quantity:     number
    unit_price:   number
  }>
}

const ink    = '#1e293b'
const muted  = '#64748b'
const faint  = '#94a3b8'
const border = '#e2e8f0'
const bg     = '#f8fafc'

// Letter page = 612 × 792 pts; margins 50 each side → usable width 512
const COL = { product: 155, vintage: 45, volume: 55, abv: 65, qty: 35, price: 77, total: 80 }

const s = StyleSheet.create({
  page: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: ink,
    lineHeight: 1.4,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  coName: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  coSub:  { fontSize: 8, color: muted },
  invLabel: { fontSize: 20, fontFamily: 'Helvetica-Bold', textAlign: 'right', marginBottom: 4 },
  invMeta:  { fontSize: 8, color: muted, textAlign: 'right', marginBottom: 2 },
  invVal:   { fontFamily: 'Helvetica-Bold', color: ink },
  rule: { borderBottomWidth: 1, borderBottomColor: border, marginBottom: 20 },
  billLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: faint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  custName:  { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  custLine:  { fontSize: 8, color: muted, marginBottom: 2 },
  billTo:    { marginBottom: 24 },
  // Table
  tHead: {
    flexDirection: 'row', backgroundColor: bg,
    borderTopWidth: 1, borderTopColor: border,
    borderBottomWidth: 1, borderBottomColor: border,
    paddingVertical: 5, paddingHorizontal: 8,
  },
  tRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: border, paddingVertical: 7, paddingHorizontal: 8 },
  tHcell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: muted, textTransform: 'uppercase' },
  tCell:  { fontSize: 8.5, color: ink },
  tCellBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: ink },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  totalLabel: { fontSize: 9, color: muted, marginRight: 24 },
  totalAmt:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: ink, width: COL.total, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 36, left: 50, right: 50, borderTopWidth: 1, borderTopColor: border, paddingTop: 8 },
  footerText: { fontSize: 7.5, color: faint, textAlign: 'center' },
})

function fmt(n: number) {
  return '$' + n.toFixed(2)
}

function fmtVol(ml: number | null) {
  if (!ml) return '—'
  return VOLUME_OPTIONS.find((o) => o.value === ml)?.label ?? `${ml} ml`
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export function InvoiceDocument({ data }: { data: InvoiceDocumentData }) {
  const { invoiceNumber, invoiceDate, customer, lineItems } = data
  const total = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0)
  const addr2 = [customer.city, customer.state, customer.zip].filter(Boolean).join(', ')

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.coName}>Two Mountain Winery</Text>
            <Text style={s.coSub}>2151 Cheyne Road, Zillah, WA 98953</Text>
          </View>
          <View>
            <Text style={s.invLabel}>INVOICE</Text>
            <Text style={s.invMeta}>
              Invoice #{' '}
              <Text style={s.invVal}>{invoiceNumber}</Text>
            </Text>
            <Text style={s.invMeta}>
              Date{' '}
              <Text style={s.invVal}>{fmtDate(invoiceDate)}</Text>
            </Text>
          </View>
        </View>

        <View style={s.rule} />

        {/* ── Bill To ── */}
        <View style={s.billTo}>
          <Text style={s.billLabel}>Bill To</Text>
          <Text style={s.custName}>{customer.store_name}</Text>
          {customer.address ? <Text style={s.custLine}>{customer.address}</Text> : null}
          {addr2 ? <Text style={s.custLine}>{addr2}</Text> : null}
          {customer.liquor_license_number
            ? <Text style={s.custLine}>Liquor License # {customer.liquor_license_number}</Text>
            : null}
        </View>

        {/* ── Line Items Table ── */}
        {/* Header row */}
        <View style={s.tHead}>
          <Text style={[s.tHcell, { width: COL.product }]}>Product</Text>
          <Text style={[s.tHcell, { width: COL.vintage }]}>Vintage</Text>
          <Text style={[s.tHcell, { width: COL.volume }]}>Volume</Text>
          <Text style={[s.tHcell, { width: COL.abv }]}>ABV</Text>
          <Text style={[s.tHcell, { width: COL.qty, textAlign: 'right' }]}>Qty</Text>
          <Text style={[s.tHcell, { width: COL.price, textAlign: 'right' }]}>Unit Price</Text>
          <Text style={[s.tHcell, { width: COL.total, textAlign: 'right' }]}>Total</Text>
        </View>

        {/* Data rows */}
        {lineItems.map((li, i) => (
          <View key={i} style={s.tRow}>
            <Text style={[s.tCell, { width: COL.product }]}>{li.productName}</Text>
            <Text style={[s.tCell, { width: COL.vintage, color: muted }]}>{li.vintage ?? '—'}</Text>
            <Text style={[s.tCell, { width: COL.volume,  color: muted }]}>{fmtVol(li.volume_ml)}</Text>
            <Text style={[s.tCell, { width: COL.abv,     color: muted }]}>
              {li.abv_category === 'over_14' ? 'Over 14%' : 'Under 14%'}
            </Text>
            <Text style={[s.tCell, { width: COL.qty,   textAlign: 'right' }]}>{li.quantity}</Text>
            <Text style={[s.tCell, { width: COL.price, textAlign: 'right' }]}>{fmt(li.unit_price)}</Text>
            <Text style={[s.tCellBold, { width: COL.total, textAlign: 'right' }]}>
              {fmt(li.quantity * li.unit_price)}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Invoice Total</Text>
          <Text style={s.totalAmt}>{fmt(total)}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>Thank you for your business.</Text>
        </View>

      </Page>
    </Document>
  )
}
