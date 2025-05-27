'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import slugify from 'slugify'

export default function CompleteProfile() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    restaurantName: '',
    displayName: '',
    address: ''
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setLoading(true)
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) throw userError || new Error('No user found')
    
    // Update user's display name in auth.users
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: { display_name: formData.displayName }
    })
    
    if (updateUserError) throw updateUserError
    
    // Create restaurant entry
    const slug = slugify(formData.restaurantName, { lower: true })
    
    const { error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        owner_id: user.id,
        name: formData.restaurantName,
        slug,
        address: formData.address,
        is_active: true
      })
    
    if (restaurantError) throw restaurantError
    
    // No need to create user_profile as it's handled by database trigger
    
    // Redirect to dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Error completing profile:', error)
    alert('Failed to complete profile. Please try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-3xl font-bold">Complete Your Profile</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium">Restaurant Name</label>
              <input
                type="text"
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="text-left">
              <label className="block text-sm font-medium">Your Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="text-left">
              <label className="block text-sm font-medium">Restaurant Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}