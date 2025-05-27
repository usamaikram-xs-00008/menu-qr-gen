// app/dashboard/admin/restaurants/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { getAllRestaurants } from '@/lib/supabaseAdmin'
import RestaurantToggle from './RestaurantToggle'

export default async function RestaurantsPage() {
  const restaurants = await getAllRestaurants()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Restaurants</h1>
        <Link 
          href="/dashboard/restaurants/invite" 
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          Invite Restaurant
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {restaurant.logo_url && (
                      <div className="h-10 w-10 relative mr-3">
                        <Image 
                          className="rounded-full"
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          fill
                        />
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-900">
                      {restaurant.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {restaurant.address || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RestaurantToggle 
                    id={restaurant.id} 
                    isActive={restaurant.is_active} 
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {restaurant.owner_id?.email || 'No owner'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  
                  <Link 
                    href={`/dashboard/restaurants/${restaurant.id}/menu`}
                    className="text-green-600 hover:text-green-900"
                  >
                    View Menu
                  </Link>
                  <Link 
                    href={`/dashboard/restaurants/${restaurant.id}/qr`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    View QR Code
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}