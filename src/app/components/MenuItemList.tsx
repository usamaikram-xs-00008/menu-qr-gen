// app/components/MenuItemList.tsx
import { useState, useEffect, useCallback } from 'react'; // Add useCallback import
import { createClient } from '@/lib/supabase';
import MenuItemForm from './MenuItemForm';
import Image from 'next/image';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface MenuItemListProps {
  restaurantId: string;
  categoryId: string;
  isAdmin: boolean;
}

export default function MenuItemList({ restaurantId, isAdmin, categoryId }: MenuItemListProps) {
  const supabase = createClient();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Wrap fetchMenuItems with useCallback
  const fetchMenuItems = useCallback(async () => {
    if (!categoryId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMenuItems(data as MenuItem[] || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, supabase]); // Add dependencies

  // Update the useEffect to depend on fetchMenuItems
  useEffect(() => {
    if (categoryId) {
      fetchMenuItems();
    }
  }, [categoryId]); // Change to use fetchMenuItems instead of categoryId and restaurantId

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the local state
      setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting menu item:', err);
      alert('Failed to delete menu item. Please try again.');
    }
  };

  const handleItemChange = () => {
    fetchMenuItems();
    setEditingItem(null);
    setShowAddForm(false);
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setMenuItems(menuItems.map(item => 
        item.id === id ? { ...item, is_available: !currentStatus } : item
      ));
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Failed to update item availability. Please try again.');
    }
  };

  const handleReorder = async (itemId: string, direction: 'up' | 'down') => {
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    if ((direction === 'up' && itemIndex === 0) || 
        (direction === 'down' && itemIndex === menuItems.length - 1)) {
      return;
    }

    const swapIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    const currentItem = menuItems[itemIndex];
    const swapItem = menuItems[swapIndex];

    if (!currentItem || !swapItem) return;

    // Swap display_order values
    try {
      const { error: error1 } = await supabase
        .from('menu_items')
        .update({ display_order: swapItem.display_order })
        .eq('id', currentItem.id);

      const { error: error2 } = await supabase
        .from('menu_items')
        .update({ display_order: currentItem.display_order })
        .eq('id', swapItem.id);

      if (error1 || error2) throw error1 || error2;

      // Update the local state to reflect the changes
      fetchMenuItems();
    } catch (err) {
      console.error('Error reordering menu items:', err);
      alert('Failed to reorder menu items. Please try again.');
    }
  };

  if (loading) return <div>Loading menu items...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Menu Items</h3>
        {isAdmin && (
          <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Menu Item
        </button>
        )}
        
      </div>

      {showAddForm && (
        <div className="border p-4 rounded bg-gray-50">
          <h4 className="text-md font-medium mb-2">Add New Menu Item</h4>
          <MenuItemForm 
            restaurantId={restaurantId}
            categoryId={categoryId}
            onSuccess={handleItemChange}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {menuItems.length === 0 ? (
        <p className="text-gray-500">No menu items in this category yet.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <li key={item.id} className="border rounded-lg overflow-hidden">
              {editingItem === item.id ? (
                <div className="p-4 bg-gray-50">
                  <h4 className="text-md font-medium mb-2">Edit Menu Item</h4>
                  <MenuItemForm 
                    restaurantId={restaurantId}
                    categoryId={categoryId}
                    menuItem={item}
                    onSuccess={handleItemChange}
                    onCancel={() => setEditingItem(null)}
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {item.image_url && (
                    <div className="h-40 relative overflow-hidden">
                      <Image 
                        src={item.image_url} 
                        alt={item.name} 
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{item.name}</h4>
                      <span className="font-bold">${item.price.toFixed(2)}</span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 flex-grow">{item.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-1 ${item.is_available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm">{item.is_available ? 'Available' : 'Unavailable'}</span>
                      </div>
                      {isAdmin && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReorder(item.id, 'up')}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleReorder(item.id, 'down')}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => toggleAvailability(item.id, item.is_available)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button
                          onClick={() => setEditingItem(item.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}