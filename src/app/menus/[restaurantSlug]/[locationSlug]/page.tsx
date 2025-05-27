'use client';

import {  useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Database } from '@/lib/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Menu = Database['public']['Tables']['menus']['Row'];
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

// interface LocationPageProps {
//   params: {
//     restaurantSlug: string;
//     locationSlug: string;
//   };
// }

interface MenuWithData {
  menu: Menu;
  categories: MenuCategory[];
  items: Record<string, MenuItem[]>;
}

// Helper function to safely extract menu data
const safelyExtractMenu = (menuData: unknown): Menu | null => {
  // Default menu as fallback
//   const defaultMenu: Menu = {
//     id: '',
//     restaurant_id: '',
//     name: 'Unknown Menu',
//     description: null,
//     slug: '',
//     display_order: 0,
//     is_active: false,
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString()
//   };

  if (!menuData) {
    return null;
  }

  if (Array.isArray(menuData)) {
    // If it's an array and has items, use the first one
    return menuData.length > 0 ? (menuData[0] as Menu) : null;
  }

  // Otherwise, assume it's a Menu object
  return menuData as Menu;
};

export default function LocationPage() {
  const { restaurantSlug, locationSlug } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [menus, setMenus] = useState<MenuWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      try {
        // Step 1: Get restaurant by slug
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', restaurantSlug)
          .eq('is_active', true)
          .single();
        
        if (restaurantError || !restaurantData) {
          throw new Error('Restaurant not found');
        }
        
        setRestaurant(restaurantData);
        
        // Step 2: Get location by slug
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .eq('slug', locationSlug)
          .eq('is_active', true)
          .single();
        
        if (locationError || !locationData) {
          throw new Error('Location not found');
        }
        
        setLocation(locationData);
        
        // Step 3: Get menus assigned to this location
        const { data: locationMenusData, error: locationMenusError } = await supabase
          .from('location_menus')
          .select(`
            menu_id,
            is_active,
            menus:menu_id(*)
          `)
          .eq('location_id', locationData.id)
          .eq('is_active', true);
        
        if (locationMenusError) {
          throw locationMenusError;
        }
        
        // Process menu data safely
        const processedMenus = locationMenusData
          .filter(lm => lm.is_active)
          .map(lm => safelyExtractMenu(lm.menus))
          .filter((menu): menu is Menu => menu !== null && menu.is_active); // Type guard to ensure non-null + active
        
        if (processedMenus.length === 0) {
          setMenus([]);
          setLoading(false);
          return;
        }
        
        // Step 4: Fetch categories and items for each menu
        const menusWithData: MenuWithData[] = await Promise.all(
          processedMenus.map(async (menu) => {
            // Get categories for this menu
            const { data: categoriesData, error: categoriesError } = await supabase
              .from('menu_categories')
              .select('*')
              .eq('menu_id', menu.id)
              .eq('is_active', true)
              .order('display_order', { ascending: true });
            
            if (categoriesError) {
              throw categoriesError;
            }
            
            // Get items for each category
            const itemsByCategory: Record<string, MenuItem[]> = {};
            
            await Promise.all(
              categoriesData.map(async (category) => {
                const { data: itemsData, error: itemsError } = await supabase
                  .from('menu_items')
                  .select('*')
                  .eq('category_id', category.id)
                  .eq('is_available', true)
                  .order('display_order', { ascending: true });
                
                if (itemsError) {
                  throw itemsError;
                }
                
                itemsByCategory[category.id] = itemsData;
              })
            );
            
            return {
              menu,
              categories: categoriesData,
              items: itemsByCategory
            };
          })
        );
        
        setMenus(menusWithData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [restaurantSlug, locationSlug]);
  
  // Handle 404 cases
  if (!loading && (!restaurant || !location)) {
    notFound();
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Menu</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (menus.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">{restaurant?.name} - {location?.name}</h1>
          <p className="text-gray-600 mb-4">No active menus available at this location.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  const activeMenu = menus[activeMenuIndex];
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Restaurant header */}
      <div className="text-center mb-8">
        {restaurant?.logo_url && (
          <div className="h-24 w-auto relative mx-auto mb-4">
            <Image 
              src={restaurant.logo_url} 
              alt={restaurant.name} 
              width={96}
              height={96}
              className="h-24 w-auto mx-auto object-contain"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold">{restaurant?.name}</h1>
        <p className="text-xl mt-2">{location?.name}</p>
        {location?.address && (
          <p className="text-gray-600 mt-1">{location.address}</p>
        )}
      </div>
      
      {/* Menu Tabs (if multiple menus) */}
      {menus.length > 1 && (
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {menus.map((menuData, index) => (
              <button
                key={menuData.menu.id}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  activeMenuIndex === index 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={() => setActiveMenuIndex(index)}
              >
                {menuData.menu.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Active Menu Name (if only one menu, show its name) */}
      {menus.length === 1 && activeMenu.menu.name && (
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold">{activeMenu.menu.name}</h2>
          {activeMenu.menu.description && (
            <p className="text-gray-600 mt-1">{activeMenu.menu.description}</p>
          )}
        </div>
      )}
      
      {/* Categories & Items */}
      <div className="space-y-8">
        {activeMenu.categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No menu categories found.</p>
          </div>
        ) : (
          activeMenu.categories.map(category => (
            <div key={category.id} className="mb-8">
              <h3 className="text-xl font-bold border-b pb-2 mb-4">{category.name}</h3>
              
              {activeMenu.items[category.id]?.length > 0 ? (
                <div className="space-y-6">
                  {activeMenu.items[category.id].map(item => (
                    <div key={item.id} className="flex border-b pb-4">
                      {item.image_url && (
                        <div className="w-24 h-24 flex-shrink-0 mr-4 relative">
                          <Image 
                            src={item.image_url} 
                            alt={item.name} 
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-lg">{item.name}</h4>
                          <p className="font-bold">${item.price.toFixed(2)}</p>
                        </div>
                        {item.description && (
                          <p className="text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No items in this category</p>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-12 pt-4 border-t text-center text-gray-500 text-sm">
        <p>Menu powered by Menu QR Gen</p>
      </div>
    </div>
  );
}