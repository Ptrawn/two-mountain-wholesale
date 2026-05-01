import { google } from 'googleapis'
import { VOLUME_OPTIONS } from '@/types/product'

const HEADERS = [
  'Invoice Number',
  'Order Date',
  'Customer Name',
  'Account Type',
  'Store Address',
  'City',
  'State',
  'Zip',
  'Liquor License Number',
  'Product Name',
  'Vintage',
  'Volume',
  'ABV Category',
  'Quantity',
  'Unit Price',
  'Line Total',
  'Order Total',
]

function getClient() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

export interface SyncOrderData {
  orderDate: string
  customer: {
    store_name:            string
    account_type:          string
    address:               string | null
    city:                  string | null
    state:                 string | null
    zip:                   string | null
    liquor_license_number: string | null
  }
  lineItems: Array<{
    product_name:  string
    vintage:       number | null
    volume_ml:     number | null
    abv_category:  string
    quantity:      number
    unit_price:    number
  }>
}

export async function syncOrderToSheets(data: SyncOrderData): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  if (!spreadsheetId) return

  const sheets = getClient()

  // Add header row if the sheet is empty
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A1:Q1',
  })
  if (!existing.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    })
  }

  const { orderDate, customer, lineItems } = data
  const orderTotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0)

  const rows = lineItems.map((li) => {
    const volume   = VOLUME_OPTIONS.find((o) => o.value === li.volume_ml)?.label
                     ?? (li.volume_ml ? `${li.volume_ml} ml` : '')
    const abv      = li.abv_category === 'over_14' ? 'Over 14%' : 'Under 14%'
    const acctType = customer.account_type === 'on_premise' ? 'On-premise' : 'Off-premise'

    return [
      '',                                       // Invoice Number — generated separately
      orderDate,
      customer.store_name,
      acctType,
      customer.address               ?? '',
      customer.city                  ?? '',
      customer.state                 ?? '',
      customer.zip                   ?? '',
      customer.liquor_license_number ?? '',
      li.product_name,
      li.vintage   ?? '',
      volume,
      abv,
      li.quantity,
      li.unit_price,
      li.quantity * li.unit_price,
      orderTotal,
    ]
  })

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  })
}
