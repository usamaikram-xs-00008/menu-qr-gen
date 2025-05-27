// src/components/RestaurantMenu.tsx
import { useState } from 'react';
import Image from 'next/image';
import type { Database } from '@/lib/database.types';

// Define proper types based on your database schema
type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface RestaurantMenuProps {
  restaurant: Restaurant;
  categories: MenuCategory[];
  menuItems: {[key: string]: MenuItem[]};
}

export default function RestaurantMenu({ restaurant, categories, menuItems }: RestaurantMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Restaurant header */}
      <div className="text-center mb-8">
        {restaurant.logo_url && (
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
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        {restaurant.address && (
          <p className="text-gray-600 mt-2">{restaurant.address}</p>
        )}
      </div>
      
      {/* Category tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {categories.map(category => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                activeCategory === category.id 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Menu items */}
      <div>
        {activeCategory && menuItems[activeCategory]?.length > 0 ? (
          <div className="grid gap-6">
            {menuItems[activeCategory].map(item => (
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
                    <h3 className="font-bold text-lg">{item.name}</h3>
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
          <div className="text-center py-8 text-gray-500">
            No menu items found in this category
          </div>
        )}
      </div>
    </div>
  );
}