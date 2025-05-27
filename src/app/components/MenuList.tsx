'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/lib/database.types';
import MenuForm from './MenuForm';

type Menu = Database['public']['Tables']['menus']['Row'];

interface MenuListProps {
  restaurantId: string;
  isAdmin: boolean;
  onMenuSelect?: (menu: Menu | null) => void;
  selectedMenuId?: string | null;
}

export default function MenuList({ 
  restaurantId, 
  isAdmin, 
  onMenuSelect,
  selectedMenuId 
}: MenuListProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMenu, setEditingMenu] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/restaurants/${restaurantId}/menus`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch menus');
      }
      
      const data = await response.json();
      setMenus(data || []);
      
      // Auto-select first menu if none selected
      if (data && data.length > 0 && !selectedMenuId && onMenuSelect) {
        onMenuSelect(data[0]);
      }
    } catch (err) {
      console.error('Error fetching menus:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menus');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, selectedMenuId, onMenuSelect]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu? This will also delete all categories and items in this menu.')) {
      return;
    }

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/menus/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu');
      }

      // Update the local state
      const updatedMenus = menus.filter(menu => menu.id !== id);
      setMenus(updatedMenus);
      
      // If the deleted menu was selected, select another menu or clear selection
      if (selectedMenuId === id && onMenuSelect) {
        onMenuSelect(updatedMenus.length > 0 ? updatedMenus[0] : null);
      }
    } catch (err) {
      console.error('Error deleting menu:', err);
      alert('Failed to delete menu. Please try again.');
    }
  };

  const handleMenuChange = () => {
    fetchMenus();
    setEditingMenu(null);
    setShowAddForm(false);
  };

  const toggleMenuStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/menus/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update menu status');
      }

      // Update local state
      setMenus(menus.map(menu => 
        menu.id === id ? { ...menu, is_active: !currentStatus } : menu
      ));
    } catch (err) {
      console.error('Error toggling menu status:', err);
      alert('Failed to update menu status. Please try again.');
    }
  };

  const handleReorder = async (menuId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/menus/${menuId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reorder', 
          direction 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder menu');
      }

      // Refresh the list
      fetchMenus();
    } catch (err) {
      console.error('Error reordering menu:', err);
      alert('Failed to reorder menu. Please try again.');
    }
  };

  if (loading) return <div className="p-4">Loading menus...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Restaurant Menus</h2>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Menu
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="border p-4 rounded bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Create New Menu</h3>
          <MenuForm 
            restaurantId={restaurantId} 
            onSuccess={handleMenuChange}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {menus.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No menus created yet.</p>
          <p className="text-sm text-gray-400">
            Create your first menu to start adding categories and items.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {menus.map((menu) => (
            <div 
              key={menu.id} 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedMenuId === menu.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              } ${menu.is_active ? '' : 'opacity-75'}`}
              onClick={() => onMenuSelect && onMenuSelect(menu)}
            >
              {editingMenu === menu.id ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-medium mb-4">Edit Menu</h3>
                  <MenuForm 
                    restaurantId={restaurantId}
                    menu={menu}
                    onSuccess={handleMenuChange}
                    onCancel={() => setEditingMenu(null)}
                  />
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{menu.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        menu.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {menu.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {selectedMenuId === menu.id && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Selected
                        </span>
                      )}
                    </div>
                    {menu.description && (
                      <p className="text-gray-600 mb-2">{menu.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Slug: <code className="bg-gray-100 px-1 rounded">{menu.slug}</code>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Display Order: {menu.display_order} | Created: {new Date(menu.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleReorder(menu.id, 'up')}
                        disabled={menus.indexOf(menu) === 0}
                        className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleReorder(menu.id, 'down')}
                        disabled={menus.indexOf(menu) === menus.length - 1}
                        className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => toggleMenuStatus(menu.id, menu.is_active)}
                        className={`px-3 py-1 text-sm rounded ${
                          menu.is_active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {menu.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => setEditingMenu(menu.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(menu.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}