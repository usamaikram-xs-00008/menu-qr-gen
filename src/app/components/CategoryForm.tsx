'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Category {
  id?: string;
  name: string;
  restaurant_id: string; // Keep both restaurant_id and menu_id
  menu_id: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CategoryFormProps {
  restaurantId: string; // We need both restaurantId and menuId
  menuId: string;
  category?: Category | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CategoryForm({ 
  restaurantId,
  menuId, 
  category, 
  onSuccess, 
  onCancel 
}: CategoryFormProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: category?.name || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('menu_categories')
        .select('display_order')
        .eq('menu_id', menuId)
        .order('display_order', { ascending: false })
        .limit(1);

      if (maxOrderError) throw maxOrderError;

      const maxOrder = maxOrderData?.length ? maxOrderData[0].display_order : 0;
      
      const categoryData: Partial<Category> = {
        name: formData.name,
        restaurant_id: restaurantId, // Include both restaurant_id and menu_id
        menu_id: menuId,
        is_active: true,
      };

      if (!category) {
        // Adding a new category
        categoryData.display_order = maxOrder + 1;
      }

      let dbError;
      if (category?.id) {
        // Update existing category
        const { error } = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', category.id);
        dbError = error;
      } else {
        // Insert new category
        const { error } = await supabase
          .from('menu_categories')
          .insert([categoryData as Required<Pick<Category, 'name' | 'restaurant_id' | 'menu_id' | 'display_order' | 'is_active'>> & Partial<Category>]);
        dbError = error;
      }

      if (dbError) throw dbError;
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-100 p-3 text-red-700 rounded">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium mb-1">Category Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Saving...' : category ? 'Update Category' : 'Add Category'}
        </button>
      </div>
    </form>
  );
}