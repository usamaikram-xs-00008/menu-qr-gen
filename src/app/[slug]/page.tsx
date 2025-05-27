'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface LegacyRouteProps {
  params: {
    slug: string;
  };
}

/**
 * Legacy route handler for backward compatibility.
 * Redirects old /{restaurantSlug} URLs to the new /menus/{restaurantSlug}/{locationSlug} structure.
 */
export default function LegacyRoute({ params }: LegacyRouteProps) {
  const { slug: restaurantSlug } = params;
  const router = useRouter();

  useEffect(() => {
    async function handleRedirect() {
      try {
        const supabase = createClient();
        
        // Step 1: Check if restaurant exists
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', restaurantSlug)
          .eq('is_active', true)
          .single();
        
        if (restaurantError || !restaurant) {
          // Restaurant not found, go to 404
          router.push('/not-found');
          return;
        }
        
        // Step 2: Get first active location for this restaurant
        const { data: locations, error: locationError } = await supabase
          .from('locations')
          .select('slug')
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1);
        
        if (locationError || !locations || locations.length === 0) {
          // No active locations, go to 404
          router.push('/not-found');
          return;
        }
        
        // Step 3: Redirect to the new URL structure
        router.push(`/menus/${restaurantSlug}/${locations[0].slug}`);
      } catch (err) {
        console.error('Error in legacy redirect:', err);
        router.push('/not-found');
      }
    }
    
    handleRedirect();
  }, [restaurantSlug, router]);

  // Show loading state while redirect is being processed
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading menu...</p>
      </div>
    </div>
  );
}