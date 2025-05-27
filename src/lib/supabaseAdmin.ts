// lib/supabaseAdmin.ts
import { createClient } from '@/lib/supabase'


// Define proper interfaces for your database tables
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  display_order: number;
  category_id: string;
  created_at: string;
  updated_at: string;
}

// interface MenuCategory {
//   id: string;
//   name: string;
//   restaurant_id: string;
//   display_order: number;
//   created_at: string;
//   updated_at: string;
//   is_active: boolean;
// }

// interface Restaurant {
//   id: string;
//   name: string;
//   slug: string;
//   logo_url?: string;
//   banner_url?: string;
//   address?: string;
//   is_active: boolean;
//   owner_id: string;
//   created_at: string;
//   updated_at: string;
// }

export const supabaseAdmin = createClient()

// Get all restaurants
export async function getAllRestaurants() {
  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .select('*, owner_id(*)')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Toggle restaurant activation
export async function toggleRestaurantActivation(id: string, isActive: boolean) {
  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Get restaurant with menu details
export async function getRestaurantWithMenu(id: string) {
  // Get restaurant details
  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()
  
  if (restaurantError) throw restaurantError
  
  // Get menu categories
  const { data: categories, error: categoriesError } = await supabaseAdmin
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', id)
    .order('display_order', { ascending: true })
  
  if (categoriesError) throw categoriesError
  
  // Get menu items for each category
  // Add proper type definition here:
  const menuItems: {[categoryId: string]: MenuItem[]} = {}
  
  for (const category of categories) {
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('category_id', category.id)
      .order('display_order', { ascending: true })
    
    if (itemsError) throw itemsError
    menuItems[category.id] = items || []
  }
  
  return {
    restaurant,
    categories,
    menuItems
  }
}