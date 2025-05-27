'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import QRCodePreview from './QRCodePreview';
import { Database } from '@/lib/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
//type Menu = Database['public']['Tables']['menus']['Row'];

// Define type for the joined query result
interface LocationMenuJoin {
  id: string;
  menu_id: string;
  is_active: boolean;
  menus: {
    id: string;
    name: string;
    slug: string;
  };
}

interface LocationMenuPreviewProps {
  restaurantId: string;
}

export default function LocationMenuPreview({ restaurantId }: LocationMenuPreviewProps) {
  const supabase = createClient();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [locationMenus, setLocationMenus] = useState<Array<{id: string, slug: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch restaurant and locations
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get restaurant details
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();
        
        if (restaurantError) throw restaurantError;
        setRestaurant(restaurantData);
        
        // Get locations for this restaurant
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true);
        
        if (locationError) throw locationError;
        setLocations(locationData || []);
        
        // Set default selected location if available
        if (locationData && locationData.length > 0) {
          setSelectedLocation(locationData[0].id);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [restaurantId, supabase]);
  
  // Fetch menus for selected location
  useEffect(() => {
    async function fetchLocationMenus() {
      if (!selectedLocation) return;
      
      try {
        const { data, error } = await supabase
          .from('location_menus')
          .select(`
            id,
            menu_id,
            is_active,
            menus:menu_id(id, name, slug)
          `)
          .eq('location_id', selectedLocation)
          .eq('is_active', true);
        
        if (error) throw error;
        
        // Cast the data to the correct type
        const typedData = data as unknown as LocationMenuJoin[];
        
        const menus = typedData?.map(item => ({
          id: item.menus.id,
          slug: item.menus.slug,
          name: item.menus.name
        })) || [];
        
        setLocationMenus(menus);
      } catch (err) {
        console.error('Error fetching location menus:', err);
        setLocationMenus([]);
      }
    }
    
    fetchLocationMenus();
  }, [selectedLocation, supabase]);
  
  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  };
  
  if (loading) return <div className="p-4">Loading preview data...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!restaurant) return <div className="p-4 text-red-600">Restaurant not found</div>;
  
  const selectedLocationObj = locations.find(loc => loc.id === selectedLocation);
  
  return (
    <div className="space-y-6">
      {locations.length === 0 ? (
        <div className="text-center py-8 bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800 font-medium mb-2">No locations found</p>
          <p className="text-sm text-yellow-700">
            Create locations first to preview QR codes for them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Location:</label>
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              className="w-full p-2 border rounded"
            >
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedLocationObj && (
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Preview for: {selectedLocationObj.name}</h3>
              <QRCodePreview 
                restaurantSlug={restaurant.slug}
                restaurantName={restaurant.name}
                locationSlug={selectedLocationObj.slug}
                locationName={selectedLocationObj.name}
                availableMenus={locationMenus}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}