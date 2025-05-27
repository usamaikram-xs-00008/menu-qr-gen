'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import CategoryForm from './CategoryForm';
import { Database } from '@/lib/database.types';

interface Category {
  id: string;
  name: string;
  description: string | null;
  restaurant_id: string; // Keep both restaurant_id and menu_id
  menu_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryListProps {
  restaurantId: string; // We need both restaurantId and menuId
  menuId: string;
  onCategoryChange?: () => void;
  isAdmin: boolean;
}

export default function CategoryList({ restaurantId, menuId, isAdmin, onCategoryChange }: CategoryListProps) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!menuId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('menu_id', menuId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data as Category[] || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [menuId, supabase]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All menu items in this category will also be deleted.')) {
      return;
    }

    try {
      // First, delete all menu items in this category
      const { error: itemsError } = await supabase
        .from('menu_items')
        .delete()
        .eq('category_id', id);

      if (itemsError) throw itemsError;

      // Then delete the category
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the local state
      setCategories(categories.filter(category => category.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleCategoryChange = () => {
    fetchCategories();
    setEditingCategory(null);
    setShowAddForm(false);
    if (onCategoryChange) onCategoryChange();
  };

  const handleReorder = async (categoryId: string, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if ((direction === 'up' && categoryIndex === 0) || 
        (direction === 'down' && categoryIndex === categories.length - 1)) {
      return;
    }

    const swapIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
    const currentCategory = categories[categoryIndex];
    const swapCategory = categories[swapIndex];

    if (!currentCategory || !swapCategory) return;

    // Swap display_order values
    try {
      const { error: error1 } = await supabase
        .from('menu_categories')
        .update({ display_order: swapCategory.display_order })
        .eq('id', currentCategory.id);

      const { error: error2 } = await supabase
        .from('menu_categories')
        .update({ display_order: currentCategory.display_order })
        .eq('id', swapCategory.id);

      if (error1 || error2) throw error1 || error2;

      // Update the local state to reflect the changes
      fetchCategories();
    } catch (err) {
      console.error('Error reordering categories:', err);
      alert('Failed to reorder categories. Please try again.');
    }
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu Categories</h2>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Category
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="border p-4 rounded bg-gray-50">
          <h3 className="text-lg font-medium mb-2">Add New Category</h3>
          <CategoryForm 
            restaurantId={restaurantId} // Pass both restaurantId and menuId
            menuId={menuId}
            onSuccess={handleCategoryChange}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-gray-500">No categories yet. Add your first category to get started.</p>
      ) : (
        <ul className="divide-y">
          {categories.map((category) => (
            <li key={category.id} className="py-4">
              {editingCategory === category.id ? (
                <div className="border p-4 rounded bg-gray-50">
                  <h3 className="text-lg font-medium mb-2">Edit Category</h3>
                  <CategoryForm 
                    restaurantId={restaurantId} // Pass both restaurantId and menuId
                    menuId={menuId}
                    category={category}
                    onSuccess={handleCategoryChange}
                    onCancel={() => setEditingCategory(null)}
                  />
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReorder(category.id, 'up')}
                        disabled={categories.indexOf(category) === 0}
                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleReorder(category.id, 'down')}
                        disabled={categories.indexOf(category) === categories.length - 1}
                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEditingCategory(category.id)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}