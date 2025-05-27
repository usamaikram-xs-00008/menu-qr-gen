// src/app/dashboard/restaurants/[id]/qr/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import QRCodeGenerator from '../../../../components/QRCodeGenerator';
import type { Database } from '@/lib/database.types';
import LocationMenuPreview from '@/app/components/LocationMenuPreview';

// Define proper types
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export default function RestaurantQR({ params }: { params: { id: string } }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const restaurantId = params.id;
  
  useEffect(() => {
    // Move supabase client creation inside useEffect to avoid dependency issues
    const supabase = createClient();
    
    async function loadData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();
        
        if (error) throw error;
        setRestaurant(data);
      } catch (error) {
        console.error('Error loading restaurant:', error);
        alert('Failed to load restaurant data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [restaurantId]);
  
  if (loading) return <div>Loading...</div>;
  if (!restaurant) return <div>Restaurant not found</div>;
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{restaurant.name} - QR Code</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Menu URL</h2>
          <div className="mb-4 p-3 bg-gray-100 rounded break-all">
            <a href={`${window.location.origin}/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {`${window.location.origin}/${restaurant.slug}`}
            </a>
          </div>
          
          {/* Pass correct props to QRCodeGenerator */}
          <QRCodeGenerator 
            url={`${window.location.origin}/${restaurant.slug}`} 
            restaurantName={restaurant.name} 
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          {/* Fixed: Pass the correct props that match QRCodePreview's definition */}
          {/* <QRCodePreview 
            restaurantName={restaurant.name} 
            slug={restaurant.slug} 
          /> */}
          <LocationMenuPreview restaurantId={restaurant.id} />
        </div>
      </div>
    </div>
  );
}