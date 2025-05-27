'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/lib/database.types';
import LocationForm from './LocationForm';

type Location = Database['public']['Tables']['locations']['Row'];

interface LocationListProps {
  restaurantId: string;
  isAdmin: boolean;
}

export default function LocationList({ restaurantId, isAdmin }: LocationListProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/restaurants/${restaurantId}/locations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const data = await response.json();
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location? This will also delete all QR codes associated with this location.')) {
      return;
    }

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/locations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }

      // Update the local state
      setLocations(locations.filter(location => location.id !== id));
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location. Please try again.');
    }
  };

  const handleLocationChange = () => {
    fetchLocations();
    setEditingLocation(null);
    setShowAddForm(false);
  };

  const toggleLocationStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update location status');
      }

      // Update local state
      setLocations(locations.map(location => 
        location.id === id ? { ...location, is_active: !currentStatus } : location
      ));
    } catch (err) {
      console.error('Error toggling location status:', err);
      alert('Failed to update location status. Please try again.');
    }
  };

  if (loading) return <div className="p-4">Loading locations...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Restaurant Locations</h2>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Location
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="border p-4 rounded bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Add New Location</h3>
          <LocationForm 
            restaurantId={restaurantId} 
            onSuccess={handleLocationChange}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {locations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No locations added yet.</p>
          <p className="text-sm text-gray-400">
            Add your first location to start managing menus and generating QR codes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {locations.map((location) => (
            <div 
              key={location.id} 
              className={`border rounded-lg p-4 ${
                location.is_active ? 'bg-white' : 'bg-gray-50 opacity-75'
              }`}
            >
              {editingLocation === location.id ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Edit Location</h3>
                  <LocationForm 
                    restaurantId={restaurantId}
                    location={location}
                    onSuccess={handleLocationChange}
                    onCancel={() => setEditingLocation(null)}
                  />
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{location.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        location.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {location.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {location.address && (
                      <p className="text-gray-600 mb-2">{location.address}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Slug: <code className="bg-gray-100 px-1 rounded">{location.slug}</code>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(location.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => toggleLocationStatus(location.id, location.is_active)}
                        className={`px-3 py-1 text-sm rounded ${
                          location.is_active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {location.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setEditingLocation(location.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
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