'use client';

import { useEffect, useState } from 'react';
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

// interface MenuPageProps {
//   params: {
//     restaurantSlug: string;
//     locationSlug: string;
//     menuSlug: string;
//   };
// }

// Helper function to safely extract menu data
// const safelyExtractMenu = (menuData: unknown): Menu | null => {
//   if (!menuData) {
//     return null;
//   }

//   if (Array.isArray(menuData)) {
//     // If it's an array and has items, use the first one
//     return menuData.length > 0 ? (menuData[0] as Menu) : null;
//   }

//   // Otherwise, assume it's a Menu object
//   return menuData as Menu;
// };

export default function MenuPage() {
  const { restaurantSlug, locationSlug, menuSlug } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
        
        // Step 3: Get menu by slug and ensure it's assigned to this location
        const { data: menuData, error: menuError } = await supabase
          .from('menus')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .eq('slug', menuSlug)
          .eq('is_active', true)
          .single();
        
        if (menuError || !menuData) {
          throw new Error('Menu not found');
        }
        
        // Step 3.1: Verify this menu is assigned to this location
        const { data: locationMenuData, error: locationMenuError } = await supabase
          .from('location_menus')
          .select('id')
          .eq('location_id', locationData.id)
          .eq('menu_id', menuData.id)
          .eq('is_active', true)
          .single();
        
        if (locationMenuError || !locationMenuData) {
          throw new Error('This menu is not available at this location');
        }
        
        setMenu(menuData);
        
        // Step 4: Get categories for this menu
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('menu_id', menuData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (categoriesError) {
          throw categoriesError;
        }
        
        setCategories(categoriesData);
        
        // Step 5: Get items for each category
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
        
        setMenuItems(itemsByCategory);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [restaurantSlug, locationSlug, menuSlug]);
  
  // Handle 404 cases
  if (!loading && (!restaurant || !location || !menu)) {
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
          <Link href={`/menus/${restaurantSlug}/${locationSlug}`} className="text-blue-600 hover:underline">
            See All Menus
          </Link>
        </div>
      </div>
    );
  }
  
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
      
      {/* Menu Title */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold">{menu?.name}</h2>
        {menu?.description && (
          <p className="text-gray-600 mt-1">{menu.description}</p>
        )}
        <Link 
          href={`/menus/${restaurantSlug}/${locationSlug}`} 
          className="inline-block mt-2 text-blue-600 hover:underline"
        >
          View All Menus
        </Link>
      </div>
      
      {/* Categories & Items */}
      <div className="space-y-8">
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No menu categories found.</p>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="mb-8">
              <h3 className="text-xl font-bold border-b pb-2 mb-4">{category.name}</h3>
              
              {menuItems[category.id]?.length > 0 ? (
                <div className="space-y-6">
                  {menuItems[category.id].map(item => (
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