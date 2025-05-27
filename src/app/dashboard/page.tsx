// app/dashboard/admin/page.tsx
import Link from 'next/link'
import { getAllRestaurants } from '@/lib/supabaseAdmin'

export default async function AdminDashboard() {
  // Fetch restaurant statistics (count)
  const restaurants = await getAllRestaurants()
  console.log('Restaurants:', restaurants)
  const activeRestaurants = restaurants.filter(r => r.is_active).length
  const inactiveRestaurants = restaurants.length - activeRestaurants

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Super Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total Restaurants</h2>
          <p className="text-3xl mt-2">{restaurants.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Active Restaurants</h2>
          <p className="text-3xl mt-2 text-green-600">{activeRestaurants}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Inactive Restaurants</h2>
          <p className="text-3xl mt-2 text-red-600">{inactiveRestaurants}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <Link 
          href="/dashboard/restaurants" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View All Restaurants
        </Link>
      </div>
    </div>
  )
}