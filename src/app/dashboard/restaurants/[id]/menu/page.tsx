// src/app/dashboard/admin/restaurants/[id]/menu/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import CategoryList from '../../../../components/CategoryList';
// import CategoryForm from '../../../../components/CategoryForm';
import MenuItemList from '../../../../components/MenuItemList';
// import MenuItemForm from '../../../../components/MenuItemForm';
import { useParams } from 'next/navigation';

// Define types based on your database schema
type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type Category = Database['public']['Tables']['menu_categories']['Row'];

export default function RestaurantMenu() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]); // Added categories state
  const [loading, setLoading] = useState(true);
  // const [showCategoryForm, setShowCategoryForm] = useState(false);
  // const [showItemForm, setShowItemForm] = useState(false);
  const params = useParams();
  const restaurantId = params.id as string;
  
  // Create loadItems function with useCallback to avoid dependency issues
  const loadItems = useCallback(async (categoryId: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true });
    } catch (error) {
      console.error('Error loading items:', error);
    }
  }, []);
  
  // Create loadData function with useCallback
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Get restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
      
      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);
      
      // Get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true });
      
      if (categoriesError) throw categoriesError;
      
      // Store categories in state
      setCategories(categoriesData || []);
      
      // Set selected category if needed
      if (selectedCategory) {
        await loadItems(selectedCategory);
      } else if (categoriesData && categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
        await loadItems(categoriesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, selectedCategory, loadItems]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Modified to match CategoryForm's expected props
  // const handleCategorySuccess = async () => {
  //   await loadData();
  //   setShowCategoryForm(false);
  // };
  
  // Modified to match MenuItemForm's expected props
  // const handleItemSuccess = async () => {
  //   if (selectedCategory) {
  //     await loadItems(selectedCategory);
  //   }
  //   setShowItemForm(false);
  // };
  
  if (loading && !restaurant) return <div>Loading...</div>;
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{restaurant?.name} - Menu Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Categories Section */}
        <div>
          {/* <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Categories</h2>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              {showCategoryForm ? 'Cancel' : 'Add Category'}
            </button>
          </div> */}
          
          {/* {showCategoryForm && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <CategoryForm 
                restaurantId={restaurantId}
                onSuccess={handleCategorySuccess}
                onCancel={() => setShowCategoryForm(false)}
              />
            </div>
          )} */}
          
          <CategoryList 
            menuId=''
            restaurantId={restaurantId} 
            onCategoryChange={loadData}
            isAdmin={true}
          />
        </div>
        
        {/* Menu Items Section */}
        <div className="md:col-span-2">
          
          
          {/* Added category dropdown here */}
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
          
          {selectedCategory ? (
            <MenuItemList 
              restaurantId={restaurantId} 
              categoryId={selectedCategory}
              isAdmin={true}
            />
          ) : (
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p>Please select or create a category first</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}