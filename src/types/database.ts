export type PropertyStatus = 'checking' | 'favorite' | 'rejected' | 'completed'
export type TransactionType = 'buy' | 'rent' | 'lottery' | 'paper'

export interface Property {
  id: string
  household_id: string
  title: string
  city: string
  neighborhood: string | null
  address: string | null
  transaction_type: TransactionType
  status: PropertyStatus
  price: number
  rooms: number | null
  size_sqm: number | null
  equity: number
  monthly_rent: number
  notes: string | null
  main_image_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}
