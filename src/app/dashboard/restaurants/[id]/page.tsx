// app/dashboard/admin/restaurants/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { createClient } from '@/lib/supabase';
import RestaurantProfileForm from '../../../components/RestaurantProfileForm';
import CategoryList from '../../../components/CategoryList';
import MenuItemList from '../../../components/MenuItemList';
import QRCodeGenerator from '../../../components/QRCodeGenerator';
import LocationMenuPreview from '@/app/components/LocationMenuPreview';

interface RestaurantPageParams {
  params: {
    id: string;
  };
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export default function RestaurantManagementPage({ params }: RestaurantPageParams) {
  const { id } = params;
  const supabase = createClient();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Use useCallback to memoize the functions
  
  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRestaurant(data as Restaurant);
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      setError('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  }, [id, supabase]); // Add dependencies

  const fetchCategories = useCallback(async () => {
    if (!restaurant?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data as Category[] || []);
      
      // Set the first category as selected by default if available
      if (data?.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [restaurant, supabase, selectedCategory]); // Add dependencies

  useEffect(() => {
    if (id) {
      fetchRestaurant();
    }
  }, [id]); // Add fetchRestaurant to the dependency array

  useEffect(() => {
    if (restaurant?.id) {
      fetchCategories();
    }
  }, [restaurant]); // Add fetchCategories to the dependency array

    const handleProfileUpdate = (updatedRestaurant: Partial<Restaurant>) => {
    if (restaurant) {
      setRestaurant({ ...restaurant, ...updatedRestaurant });
    }
  };

    if (loading) return <div className="p-8">Loading restaurant details...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{restaurant?.name || 'Restaurant Management'}</h1>
        <p className="text-gray-600">Manage your restaurant profile, menu, and QR code</p>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Restaurant Profile
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'menu'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Menu Management
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'qrcode'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preview Menu
            </button>
          </nav>
        </div>
      </div>
      
      <div className="mt-8">
        {activeTab === 'profile' && restaurant && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Restaurant Profile</h2>
            <RestaurantProfileForm 
              restaurant={restaurant} 
              onSuccess={handleProfileUpdate}
              loading={false}
            />
          </div>
        )}
        
        {activeTab === 'menu' && restaurant && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <CategoryList
                  menuId={'0'} 
                  restaurantId={restaurant.id} 
                  onCategoryChange={fetchCategories}
                  isAdmin={true}
                />
              </div>
              
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Select Category</label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border rounded"
                    disabled={categories.length === 0}
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                {selectedCategory && (
                  <MenuItemList 
                    restaurantId={restaurant.id} 
                    categoryId={selectedCategory}
                    isAdmin={true}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'qrcode' && restaurant && (
          <div className="max-w-2xl">
            <QRCodeGenerator 
                        url={`${window.location.origin}/${restaurant.slug}`} 
                        restaurantName={restaurant.name} 
                      />
          </div>
        )}
        
        {activeTab === 'preview' && restaurant && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Menu Preview</h2>
            <p className="mb-4 text-gray-600">
              This is how your menu will appear to customers when they scan the QR code.
            </p>
            
            {/* <QRCodePreview 
              restaurantName={restaurant.name}
              slug={restaurant.slug}
            /> */}
            <LocationMenuPreview restaurantId={restaurant.id} />
          </div>
        )}
      </div>
    </div>
  );
}