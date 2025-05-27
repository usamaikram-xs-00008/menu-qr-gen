'use client';

import { useState } from 'react';
import { Database } from '@/lib/database.types';

type Menu = Database['public']['Tables']['menus']['Row'];

interface MenuFormProps {
  restaurantId: string;
  menu?: Menu | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MenuForm({ 
  restaurantId, 
  menu, 
  onSuccess, 
  onCancel 
}: MenuFormProps) {
  const [formData, setFormData] = useState({
    name: menu?.name || '',
    description: menu?.description || '',
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
      const url = menu 
        ? `/api/restaurants/${restaurantId}/menus/${menu.id}`
        : `/api/restaurants/${restaurantId}/menus`;
      
      const method = menu ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save menu');
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving menu:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-100 p-3 text-red-700 rounded">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium mb-1">Menu Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
          placeholder="e.g., Breakfast Menu, Dinner Menu, Happy Hour"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description (Optional)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="Brief description of this menu"
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
          {loading ? 'Saving...' : menu ? 'Update Menu' : 'Create Menu'}
        </button>
      </div>
    </form>
  );
}