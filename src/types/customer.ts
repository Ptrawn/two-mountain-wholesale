export type AccountType = 'on_premise' | 'off_premise'

export interface Customer {
  id: string
  store_name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  liquor_license_number: string | null
  phone: string | null
  email: string | null
  contact_name: string | null
  account_type: AccountType
  active: boolean
  created_at: string
}
