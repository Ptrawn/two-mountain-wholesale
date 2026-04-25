export type AbvCategory = 'over_14' | 'under_14'

export interface Product {
  id: string
  name: string
  vintage: number | null
  volume_ml: number | null
  abv_category: AbvCategory
  active: boolean
  created_at: string
}

export const VOLUME_OPTIONS = [
  { value: 187,  label: '187 ml',   name: 'Split'          },
  { value: 375,  label: '375 ml',   name: 'Half Bottle'    },
  { value: 750,  label: '750 ml',   name: 'Standard'       },
  { value: 1000, label: '1,000 ml', name: 'Liter'          },
  { value: 1500, label: '1,500 ml', name: 'Magnum'         },
  { value: 3000, label: '3,000 ml', name: 'Double Magnum'  },
] as const
