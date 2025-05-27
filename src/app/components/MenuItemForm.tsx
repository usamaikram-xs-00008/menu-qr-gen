// app/components/MenuItemForm.tsx
import { useState, ChangeEvent, FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import ImageUploader from './ImageUploader';

interface MenuItem {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category_id: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

interface MenuItemFormProps {
  restaurantId: string;
  categoryId: string;
  menuItem?: MenuItem | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MenuItemForm({ 
  restaurantId, 
  categoryId, 
  menuItem, 
  onSuccess, 
  onCancel 
}: MenuItemFormProps) {
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    name: menuItem?.name || '',
    description: menuItem?.description || '',
    price: menuItem?.price ? menuItem.price.toString() : '',
    image_url: menuItem?.image_url || null,
    is_available: menuItem?.is_available ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handler for when image upload is complete
  const handleImageUploadComplete = (url: string) => {
    setFormData(prev => ({ 
      ...prev, 
      image_url: url 
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('menu_items')
        .select('display_order')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: false })
        .limit(1);

      if (maxOrderError) throw maxOrderError;

      const maxOrder = maxOrderData?.length ? maxOrderData[0].display_order : 0;
      
      const itemData: Partial<MenuItem> = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        is_available: formData.is_available,
        category_id: categoryId,
      };

      if (!menuItem) {
        // Adding a new menu item
        itemData.display_order = maxOrder + 1;
      }

      let dbError;
      if (menuItem?.id) {
        // Update existing menu item
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', menuItem.id);
        dbError = error;
      } else {
        // Insert new menu item
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData as Required<Pick<MenuItem, 'name' | 'price' | 'category_id' | 'display_order'>> & Partial<MenuItem>]);
        dbError = error;
      }

      if (dbError) throw dbError;
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving menu item:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-100 p-3 text-red-700 rounded">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium mb-1">Item Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description (Optional)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={2}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Price</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Item Image (Optional)</label>
        <ImageUploader 
          bucketName="restaurant-images"
          folderPath={`restaurants/${restaurantId}/menu-items/${categoryId}`}
          onUploadComplete={handleImageUploadComplete}
          currentImageUrl={formData.image_url}
          aspectRatio="4:3"
        />
        <p className="text-xs text-gray-500 mt-1">
          Recommended: Food image in landscape format (4:3)
        </p>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_available"
          name="is_available"
          checked={formData.is_available}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 rounded"
        />
        <label htmlFor="is_available" className="ml-2 text-sm">
          Item is available
        </label>
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
          {loading ? 'Saving...' : menuItem ? 'Update Menu Item' : 'Add Menu Item'}
        </button>
      </div>
    </form>
  );
}