import { createClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { Database } from '@/lib/database.types';

type Location = Database['public']['Tables']['locations']['Row'];
type InsertLocation = Database['public']['Tables']['locations']['Insert'];
type UpdateLocation = Database['public']['Tables']['locations']['Update'];

export async function getLocationsByRestaurantId(restaurantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Location[];
}

export async function getLocationById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Location;
}

export async function createLocation(location: Omit<InsertLocation, 'id' | 'slug'>) {
  const supabase = createClient();
  const slug = slugify(location.name, { lower: true, strict: true });
  
  const { data, error } = await supabase
    .from('locations')
    .insert([{
      id: uuidv4(),
      slug,
      ...location,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Location;
}

export async function updateLocation(id: string, updates: UpdateLocation) {
  const supabase = createClient();
  
  // If name is being updated, also update the slug
  let slug = updates.slug;
  if (updates.name) {
    slug = slugify(updates.name, { lower: true, strict: true });
  }
  
  const { data, error } = await supabase
    .from('locations')
    .update({
      ...updates,
      slug,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Location;
}

export async function deleteLocation(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

export async function getLocationBySlug(restaurantSlug: string, locationSlug: string) {
  const supabase = createClient();
  
  // First get the restaurant by slug
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', restaurantSlug)
    .single();
  
  if (restaurantError) throw restaurantError;
  
  // Then get the location by restaurant ID and location slug
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('slug', locationSlug)
    .single();
  
  if (locationError) throw locationError;
  return location as Location;
}