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
  monthly_insurance: number
  monthly_maintenance: number
  monthly_transport: number
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
  public_url: string | null
  created_by: string
  created_at: string
}

export interface HouseholdSettings {
  id?: string
  household_id: string
  monthly_income: number
  fixed_expenses: number
  current_equity: number
  protected_reserve: number
  desired_payment: number
  maximum_payment: number
}

export interface PropertyRating {
  id?: string
  property_id: string
  user_id: string
  overall: number
  location: number
  layout: number
  price: number
  neighborhood: number
  future_potential: number
}

export interface PropertyTask {
  id: string
  property_id: string
  title: string
  assigned_to: string | null
  due_date: string | null
  completed: boolean
}

export interface PropertyComment {
  id: string
  property_id: string
  user_id: string
  content: string
  created_at: string
  author_name?: string
}
