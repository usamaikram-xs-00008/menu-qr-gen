import { createClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/lib/database.types';

type LocationMenu = Database['public']['Tables']['location_menus']['Row'];
type Menu = Database['public']['Tables']['menus']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

export async function getMenusByLocationId(locationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('location_menus')
    .select(`
      id,
      is_active,
      created_at,
      updated_at,
      menus:menu_id(*)
    `)
    .eq('location_id', locationId);
  
  if (error) throw error;
  return data;
}

export async function getLocationsByMenuId(menuId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('location_menus')
    .select(`
      id,
      is_active,
      created_at,
      updated_at,
      locations:location_id(*)
    `)
    .eq('menu_id', menuId);
  
  if (error) throw error;
  return data;
}

export async function assignMenuToLocation(locationId: string, menuId: string) {
  const supabase = createClient();
  
  // Check if relation already exists
  const { data: existingData, error: existingError } = await supabase
    .from('location_menus')
    .select('id')
    .eq('location_id', locationId)
    .eq('menu_id', menuId)
    .maybeSingle();
  
  if (existingError) throw existingError;
  
  // If already exists, return it
  if (existingData) {
    return existingData;
  }
  
  // Otherwise create a new relation
  const { data, error } = await supabase
    .from('location_menus')
    .insert([{
      id: uuidv4(),
      location_id: locationId,
      menu_id: menuId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data as LocationMenu;
}

export async function removeMenuFromLocation(locationId: string, menuId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('location_menus')
    .delete()
    .eq('location_id', locationId)
    .eq('menu_id', menuId);
  
  if (error) throw error;
  return true;
}

export async function toggleLocationMenuStatus(relationId: string, isActive: boolean) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('location_menus')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', relationId)
    .select()
    .single();
  
  if (error) throw error;
  return data as LocationMenu;
}