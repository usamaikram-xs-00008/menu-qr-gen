import { createClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { Database } from '@/lib/database.types';

type Menu = Database['public']['Tables']['menus']['Row'];
type InsertMenu = Database['public']['Tables']['menus']['Insert'];
type UpdateMenu = Database['public']['Tables']['menus']['Update'];

export async function getMenusByRestaurantId(restaurantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return data as Menu[];
}

export async function getMenuById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Menu;
}

export async function createMenu(menu: Omit<InsertMenu, 'id' | 'slug' | 'display_order'>) {
  const supabase = createClient();
  const slug = slugify(menu.name, { lower: true, strict: true });
  
  // Get the max display order for this restaurant's menus
  const { data: maxOrderData, error: maxOrderError } = await supabase
    .from('menus')
    .select('display_order')
    .eq('restaurant_id', menu.restaurant_id)
    .order('display_order', { ascending: false })
    .limit(1);
  
  if (maxOrderError) throw maxOrderError;
  
  const maxOrder = maxOrderData?.length ? maxOrderData[0].display_order : 0;
  const display_order = maxOrder + 1;
  
  const { data, error } = await supabase
    .from('menus')
    .insert([{
      id: uuidv4(),
      slug,
      display_order,
      ...menu,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Menu;
}

export async function updateMenu(id: string, updates: UpdateMenu) {
  const supabase = createClient();
  
  // If name is being updated, also update the slug
  let slug = updates.slug;
  if (updates.name) {
    slug = slugify(updates.name, { lower: true, strict: true });
  }
  
  const { data, error } = await supabase
    .from('menus')
    .update({
      ...updates,
      slug,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Menu;
}

export async function deleteMenu(id: string) {
  const supabase = createClient();
  
  // First delete all categories and their items in this menu
  const { data: categories, error: categoriesError } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('menu_id', id);
  
  if (categoriesError) throw categoriesError;
  
  // Delete all menu items in these categories
  if (categories && categories.length > 0) {
    const categoryIds = categories.map(cat => cat.id);
    const { error: itemsError } = await supabase
      .from('menu_items')
      .delete()
      .in('category_id', categoryIds);
    
    if (itemsError) throw itemsError;
  }
  
  // Delete all categories in this menu
  const { error: categoriesDeleteError } = await supabase
    .from('menu_categories')
    .delete()
    .eq('menu_id', id);
  
  if (categoriesDeleteError) throw categoriesDeleteError;
  
  // Delete location-menu relationships
  const { error: locationMenuError } = await supabase
    .from('location_menus')
    .delete()
    .eq('menu_id', id);
  
  if (locationMenuError) throw locationMenuError;
  
  // Finally delete the menu
  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

export async function reorderMenu(id: string, direction: 'up' | 'down') {
  const supabase = createClient();
  
  // First get the current menu
  const { data: currentMenu, error: currentMenuError } = await supabase
    .from('menus')
    .select('*')
    .eq('id', id)
    .single();
  
  if (currentMenuError) throw currentMenuError;
  
  // Get the menu to swap with
  const { data: menusList, error: menusListError } = await supabase
    .from('menus')
    .select('*')
    .eq('restaurant_id', currentMenu.restaurant_id)
    .order('display_order', { ascending: true });
  
  if (menusListError) throw menusListError;
  
  const currentIndex = menusList.findIndex(m => m.id === id);
  if (currentIndex === -1) throw new Error('Menu not found in list');
  
  // Calculate new index
  const newIndex = direction === 'up' ? Math.max(0, currentIndex - 1) : Math.min(menusList.length - 1, currentIndex + 1);
  
  // If no change (at the end/beginning already), return
  if (newIndex === currentIndex) return currentMenu;
  
  // Swap display_order with the menu at the new index
  const swapMenu = menusList[newIndex];
  
  // Update both menus' display_order
  const { error: error1 } = await supabase
    .from('menus')
    .update({ display_order: swapMenu.display_order })
    .eq('id', currentMenu.id);
  
  if (error1) throw error1;
  
  const { error: error2 } = await supabase
    .from('menus')
    .update({ display_order: currentMenu.display_order })
    .eq('id', swapMenu.id);
  
  if (error2) throw error2;
  
  // Get the updated menu
  const { data: updatedMenu, error: updatedMenuError } = await supabase
    .from('menus')
    .select('*')
    .eq('id', id)
    .single();
  
  if (updatedMenuError) throw updatedMenuError;
  return updatedMenu as Menu;
}