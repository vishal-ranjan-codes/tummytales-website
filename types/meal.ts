/**
 * Meal Type Definitions
 */

export type ItemType = 'fixed' | 'choice_group' | 'optional'

export interface FixedItem {
  type: 'fixed'
  name: string
  quantity?: number
  image_url?: string | null
}

export interface ChoiceGroup {
  type: 'choice_group'
  group_name: string
  image_url?: string | null
  options: Array<{
    name: string
    quantity?: number
    image_url?: string | null
  }>
}

export interface OptionalItem {
  type: 'optional'
  name: string
  quantity?: number
  image_url?: string | null
}

export type MealItem = FixedItem | ChoiceGroup | OptionalItem

export interface Meal {
  id: string
  vendor_id: string
  slot: 'breakfast' | 'lunch' | 'dinner'
  name: string
  description: string | null
  items: string[]  // Legacy field - keep for backward compatibility
  items_enhanced: MealItem[] | null
  is_veg: boolean
  image_url: string | null
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

