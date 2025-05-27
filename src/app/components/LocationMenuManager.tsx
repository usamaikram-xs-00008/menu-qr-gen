'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/lib/database.types';

type Location = Database['public']['Tables']['locations']['Row'];
type Menu = Database['public']['Tables']['menus']['Row'];

interface LocationMenuManagerProps {
  restaurantId: string;
  isAdmin: boolean;
}

interface MenuAssignment {
  id: string;
  menu_id: string;
  is_active: boolean;
  menus: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    is_active: boolean;
  };
}

interface LocationWithMenus extends Location {
  assignedMenus: MenuAssignment[];
}

export default function LocationMenuManager({ restaurantId, isAdmin }: LocationMenuManagerProps) {
  const [locations, setLocations] = useState<LocationWithMenus[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      
      // Fetch locations
      const locationsResponse = await fetch(`/api/restaurants/${restaurantId}/locations`);
      if (!locationsResponse.ok) throw new Error('Failed to fetch locations');
      const locationsData = await locationsResponse.json();
      
      // Fetch menus
      const menusResponse = await fetch(`/api/restaurants/${restaurantId}/menus`);
      if (!menusResponse.ok) throw new Error('Failed to fetch menus');
      const menusData = await menusResponse.json();
      
      // Fetch assigned menus for each location
      const locationsWithMenus: LocationWithMenus[] = await Promise.all(
        locationsData.map(async (location: Location) => {
          try {
            const menuResponse = await fetch(`/api/locations/${location.id}/menus`);
            if (!menuResponse.ok) {
              console.warn(`Failed to fetch menus for location ${location.id}`);
              return {
                ...location,
                assignedMenus: []
              };
            }
            const assignedMenus = await menuResponse.json();
            
            return {
              ...location,
              assignedMenus: assignedMenus || []
            };
          } catch (err) {
            console.error(`Error fetching menus for location ${location.id}:`, err);
            return {
              ...location,
              assignedMenus: []
            };
          }
        })
      );
      
      setLocations(locationsWithMenus);
      setMenus(menusData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignMenuToLocation = async (locationId: string, menuId: string) => {
    try {
      const response = await fetch(`/api/locations/${locationId}/menus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menuId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign menu to location');
      }

      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error assigning menu:', err);
      alert('Failed to assign menu to location. Please try again.');
    }
  };

  const removeMenuFromLocation = async (locationId: string, menuId: string) => {
    if (!confirm('Are you sure you want to remove this menu from this location?')) {
      return;
    }

    try {
      const response = await fetch(`/api/locations/${locationId}/menus/${menuId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove menu from location');
      }

      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error removing menu:', err);
      alert('Failed to remove menu from location. Please try again.');
    }
  };

  const toggleMenuStatus = async (locationId: string, menuId: string, relationId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/locations/${locationId}/menus/${menuId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isActive: !currentStatus,
          relationId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update menu status');
      }

      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error toggling menu status:', err);
      alert('Failed to update menu status. Please try again.');
    }
  };

  if (loading) return <div className="p-4">Loading location-menu assignments...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Location-Menu Assignments</h2>
        <p className="text-gray-600 text-sm">
          Assign menus to locations. Each location can have multiple menus, and each menu can be used at multiple locations.
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No locations found.</p>
          <p className="text-sm text-gray-400">
            Create locations first to assign menus to them.
          </p>
        </div>
      ) : menus.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No menus found.</p>
          <p className="text-sm text-gray-400">
            Create menus first to assign them to locations.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {locations.map((location) => (
            <div key={location.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">{location.name}</h3>
                  {location.address && (
                    <p className="text-sm text-gray-600">{location.address}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  location.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {location.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Assigned Menus:</h4>
                
                {location.assignedMenus.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No menus assigned to this location.</p>
                ) : (
                  <div className="grid gap-2">
                    {location.assignedMenus.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {assignment.menus?.name || 'Unknown Menu'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            assignment.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {assignment.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {isAdmin && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleMenuStatus(
                                location.id, 
                                assignment.menu_id, 
                                assignment.id, 
                                assignment.is_active
                              )}
                              className={`px-2 py-1 text-xs rounded ${
                                assignment.is_active
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {assignment.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => removeMenuFromLocation(location.id, assignment.menu_id)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-2">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Add Menu:</h5>
                    <div className="flex gap-2 flex-wrap">
                      {menus
                        .filter(menu => 
                          menu.is_active && 
                          !location.assignedMenus.some(am => am.menu_id === menu.id)
                        )
                        .map(menu => (
                          <button
                            key={menu.id}
                            onClick={() => assignMenuToLocation(location.id, menu.id)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            + {menu.name}
                          </button>
                        ))}
                      {menus.filter(menu => 
                        menu.is_active && 
                        !location.assignedMenus.some(am => am.menu_id === menu.id)
                      ).length === 0 && (
                        <span className="text-sm text-gray-500 italic">
                          {menus.length === 0 
                            ? 'No menus available' 
                            : 'All active menus already assigned'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}