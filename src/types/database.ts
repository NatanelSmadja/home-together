export type TransactionType = 'buy' | 'rent' | 'lottery' | 'paper'

export interface Property {
  id: string
  household_id: string
  created_by: string
  title: string
  city: string
  neighborhood: string | null
  address: string | null
  transaction_type: TransactionType
  price: number
  rooms: number | null
  size_sqm: number | null
  balcony_sqm: number | null
  floor: number | null
  total_floors: number | null
  bathrooms: number | null
  parking_spaces: number | null
  storage_sqm: number | null
  property_condition: string | null
  equity: number
  monthly_rent: number
  monthly_arnona: number
  monthly_building_fee: number
  main_image_url: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  id: string
  property_id: string
  household_id: string
  storage_path: string
  public_url: string
  created_by: string
  created_at: string
}
