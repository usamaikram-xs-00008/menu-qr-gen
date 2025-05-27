// app/components/RestaurantProfileForm.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import ImageUploader from './ImageUploader'

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  // other fields...
}

interface RestaurantProfileFormProps {
  restaurant: Restaurant;
  onSuccess: (updatedRestaurant: Partial<Restaurant>) => void;
  loading: boolean;
}

export default function RestaurantProfileForm({ 
  restaurant, 
  onSuccess,
  loading: initialLoading
}: RestaurantProfileFormProps) {
  const supabase = createClient()
  const [formData, setFormData] = useState({
    name: restaurant.name,
    address: restaurant.address || '',
    logo_url: restaurant.logo_url,
    banner_url: restaurant.banner_url
  })
  const [loading, setLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogoUpload = (url: string) => {
    setFormData({
      ...formData,
      logo_url: url
    })
  }

  const handleBannerUpload = (url: string) => {
    setFormData({
      ...formData,
      banner_url: url
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          name: formData.name,
          address: formData.address,
          logo_url: formData.logo_url,
          banner_url: formData.banner_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurant.id)
        .select()
        .single()

      if (error) throw error

      setSuccessMessage('Restaurant profile updated successfully')
      onSuccess(data)
    } catch (err) {
      console.error('Error updating restaurant:', err)
      setError('Failed to update restaurant profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 p-4 rounded-md mb-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Restaurant Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Restaurant Logo</label>
        <ImageUploader
          bucketName="restaurant-images"
          folderPath={`restaurants/${restaurant.id}/logo`}
          onUploadComplete={handleLogoUpload}
          currentImageUrl={formData.logo_url}
          aspectRatio="1:1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Recommended: Square image, at least 300x300px
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Banner Image</label>
        <ImageUploader
          bucketName="restaurant-images"
          folderPath={`restaurants/${restaurant.id}/banner`}
          onUploadComplete={handleBannerUpload}
          currentImageUrl={formData.banner_url}
          aspectRatio="16:9"
        />
        <p className="text-xs text-gray-500 mt-1">
          Recommended: Wide image, at least 1200x675px
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}