'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import RestaurantProfileForm from '@/app/components/RestaurantProfileForm';
import CategoryList from '@/app/components/CategoryList';
import MenuItemList from '@/app/components/MenuItemList';
// import QRCodeGenerator from '@/app/components/QRCodeGenerator';
import LocationList from '@/app/components/LocationList';
import MenuList from '@/app/components/MenuList'; // New import
import LocationMenuManager from '@/app/components/LocationMenuManager'; // New import
import { Database } from '@/lib/database.types';
import LocationMenuPreview from '../components/LocationMenuPreview';
import LocationQRManager from '../components/LocationQRManager';
import Breadcrumbs from '../components/Breadcrumbs';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type Menu = Database['public']['Tables']['menus']['Row'];
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];

export default function RestaurantManagementPage() {
  const supabase = createClient();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user session
  const fetchSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (data.session) {
        const { data: userProfileData, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (userProfileError) throw userProfileError;

       

        if(userProfileData.role_id === 1 || userProfileData.role_id === 2) {
           setUserId(userProfileData.id);
          setActiveTab('profile')
          setIsAdmin(true);
        } else {
           setUserId(userProfileData.created_by_id);
          setActiveTab('qrcode')
          setIsAdmin(false);
        }
      } else {
        setError('No active session found. Please sign in.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to authenticate user. Please try signing in again.');
      setLoading(false);
    }
  }, [supabase]);

  // Fetch restaurant based on owner_id
  const fetchRestaurant = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (error) throw error;
      setRestaurant(data as Restaurant);
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      setError('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  // Fetch categories for selected menu
  const fetchCategories = useCallback(async () => {
    if (!selectedMenu?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', selectedMenu.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data as MenuCategory[] || []);
      
      if (data?.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [selectedMenu, supabase, selectedCategory]);

  // Effects
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (userId) {
      fetchRestaurant();
    }
  }, [userId, fetchRestaurant]);

  useEffect(() => {
    if (selectedMenu?.id) {
      fetchCategories();
    }
  }, [selectedMenu, fetchCategories]);

  const handleProfileUpdate = (updatedRestaurant: Partial<Restaurant>) => {
    if (restaurant) {
      setRestaurant({ ...restaurant, ...updatedRestaurant });
    }
  };

  const handleMenuSelect = (menu: Menu | null) => {
    setSelectedMenu(menu);
    setSelectedCategory(null); // Reset category selection when menu changes
  };

  if (loading) return <div className="p-8">Loading restaurant details...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{restaurant?.name || 'Restaurant Management'}</h1>
        <p className="text-gray-600">Manage your restaurant profile, locations, menus, and QR codes</p>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {isAdmin && (
              <>
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
              onClick={() => setActiveTab('locations')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'locations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Locations
            </button>
            <button
              onClick={() => setActiveTab('menus')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'menus'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Menus
            </button>
            <button
              onClick={() => setActiveTab('menu-assignment')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'menu-assignment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Menu Assignment
            </button>
            <button
              onClick={() => setActiveTab('menu-items')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'menu-items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Menu Items
            </button>
              </>
              
            )}
            
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
        {activeTab === 'profile' && restaurant && isAdmin && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Restaurant Profile</h2>
            <RestaurantProfileForm 
              restaurant={restaurant} 
              onSuccess={handleProfileUpdate}
              loading={false}
            />
          </div>
        )}

        {activeTab === 'locations' && restaurant && isAdmin && (
          <div>
            <LocationList 
              restaurantId={restaurant.id} 
              isAdmin={isAdmin}
            />
          </div>
        )}

        {/* New Menus Tab Content */}
        {activeTab === 'menus' && restaurant && isAdmin && (
          <div>
            <MenuList 
              restaurantId={restaurant.id} 
              isAdmin={isAdmin}
              onMenuSelect={handleMenuSelect}
              selectedMenuId={selectedMenu?.id}
            />
          </div>
        )}

        {/* New Menu Assignment Tab Content */}
        {activeTab === 'menu-assignment' && restaurant && isAdmin && (
          <div>
            <LocationMenuManager 
              restaurantId={restaurant.id} 
              isAdmin={isAdmin}
            />
          </div>
        )}
        
        {activeTab === 'menu-items' && restaurant && isAdmin && (
          <div className="space-y-8">
            {!selectedMenu ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Select a menu first to manage categories and items.</p>
                <button
                  onClick={() => setActiveTab('menus')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Go to Menus
                </button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">
                    Managing: {selectedMenu.name}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {selectedMenu.description || 'No description'}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <CategoryList 
                      restaurantId={restaurant.id} // Pass both restaurantId and menuId
                      menuId={selectedMenu.id}
                      onCategoryChange={fetchCategories}
                      isAdmin={isAdmin}
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
                        isAdmin={isAdmin}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* {activeTab === 'qrcode' && restaurant && (
          <div className="max-w-2xl">
            <div className="bg-yellow-100 p-4 rounded-lg mb-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> QR code generation will be updated to work with specific locations in Phase 4.
              </p>
            </div>
            <QRCodeGenerator 
              url={`${window.location.origin}/${restaurant.slug}`} 
              restaurantName={restaurant.name} 
            />
          </div>
        )} */}

        {activeTab === 'qrcode' && restaurant && (
  <div className="max-w-6xl">
    <Breadcrumbs 
      items={[
        { label: 'Restaurant Management', href: '/me' },
        { label: 'QR Code Management' }
      ]}
    />
    
    <h2 className="text-xl font-semibold mt-4 mb-4">QR Code Management</h2>
    
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <h3 className="font-medium text-blue-900 mb-1">Enhanced QR Code Management</h3>
      <p className="text-blue-700">
        Generate and manage QR codes for your locations and menus. Customers can scan these codes to view your menus on their phones.
      </p>
    </div>
    
    <LocationQRManager restaurantId={restaurant.id} isAdmin={isAdmin} />
  </div>
)}
        
        {/* {activeTab === 'preview' && restaurant && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Menu Preview</h2>
            <div className="bg-yellow-100 p-4 rounded-lg mb-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> Menu preview will be updated to show location-specific menus in Phase 4.
              </p>
            </div>
            <p className="mb-4 text-gray-600">
              This is how your menu will appear to customers when they scan the QR code.
            </p>
            
            <QRCodePreview 
              restaurantName={restaurant.name}
              slug={restaurant.slug}
            />
          </div>
        )} */}
        {activeTab === 'preview' && restaurant && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Menu Preview</h2>
    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
      <h3 className="font-medium text-blue-900 mb-1">Enhanced QR Menu Preview</h3>
      <p className="text-blue-700">
        This preview shows exactly what your customers will see when they scan a QR code. 
        You can preview both location-wide menus and specific menu QR codes.
      </p>
    </div>
    
    <LocationMenuPreview restaurantId={restaurant.id} />
  </div>
)}
      </div>
    </div>
  );
}