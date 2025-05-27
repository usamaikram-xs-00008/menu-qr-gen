// src/app/dashboard/restaurants/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import RestaurantProfileForm from '../../../components/RestaurantProfileForm';


// Define the form data structure that matches what your component will provide
interface RestaurantFormData {
  name: string;
  address?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
}

export default function NewRestaurant() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async (restaurantData: RestaurantFormData) => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      // Create slug from name
      const slug = restaurantData.name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      // Insert restaurant
      const { error } = await supabase
        .from('restaurants')
        .insert({
          owner_id: session.user.id,
          name: restaurantData.name,
          slug: slug,
          address: restaurantData.address,
          logo_url: restaurantData.logo_url,
          banner_url: restaurantData.banner_url,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Navigate to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating restaurant:', error);
      alert('Failed to create restaurant');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Restaurant</h1>
      {/* Cast the component props to match the expected interface */}
      <RestaurantProfileForm 
        onSuccess={handleSubmit}
        loading={loading}
      />
    </div>
  );
}