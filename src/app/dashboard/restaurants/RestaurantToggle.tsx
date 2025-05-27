// app/dashboard/admin/restaurants/RestaurantToggle.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function RestaurantToggle({ id, isActive }: { id: string, isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [isLoading, setIsLoading] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const toggleStatus = async () => {
    setIsLoading(true)
    try {
      const newStatus = !active
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: newStatus })
        .eq('id', id)
        
      if (error) throw error
      setActive(newStatus)
    } catch (error) {
      console.error('Error toggling restaurant status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center">
      <button
        onClick={toggleStatus}
        disabled={isLoading}
        className={`
          ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
          px-3 py-1 rounded-full text-xs font-semibold
          flex items-center
        `}
      >
        <span className={`
          h-2 w-2 rounded-full mr-2
          ${active ? 'bg-green-500' : 'bg-red-500'}
          ${isLoading ? 'animate-pulse' : ''}
        `}></span>
        {active ? 'Active' : 'Inactive'}
      </button>
    </div>
  )
}