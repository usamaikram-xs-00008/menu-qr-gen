// app/me/layout.tsx
'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  Home, 
  //Users, 
  LogOut, 
  ChevronLeft,
  QrCode,
  //Store,
  UserPlus,
  //Settings,
  //CreditCard,
  //BarChart3
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  requiresRole?: 'restaurant_admin' | 'super_admin'
}

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('role_id')
            .eq('id', session.user.id)
            .single()
          
          setUserRole(userProfile?.role_id || null)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [supabase])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: '/me',
      icon: <Home className="w-5 h-5" />
    },
    // {
    //   label: 'Restaurant',
    //   href: '/me/restaurant',
    //   icon: <Store className="w-5 h-5" />,
    //   requiresRole: 'restaurant_admin'
    // },
    // {
    //   label: 'Menu',
    //   href: '/me/menu',
    //   icon: <QrCode className="w-5 h-5" />,
    //   requiresRole: 'restaurant_admin'
    // },
    {
      label: 'Invite Staff',
      href: '/me/staff/invite',
      icon: <UserPlus className="w-5 h-5" />,
      requiresRole: 'restaurant_admin'
    },
    // {
    //   label: 'Analytics',
    //   href: '/me/analytics',
    //   icon: <BarChart3 className="w-5 h-5" />,
    //   requiresRole: 'restaurant_admin'
    // },
    // {
    //   label: 'Billing',
    //   href: '/me/billing',
    //   icon: <CreditCard className="w-5 h-5" />,
    //   requiresRole: 'restaurant_admin'
    // },
    // {
    //   label: 'All Restaurants',
    //   href: '/me/restaurants',
    //   icon: <Users className="w-5 h-5" />,
    //   requiresRole: 'super_admin'
    // },
    // {
    //   label: 'Settings',
    //   href: '/me/settings',
    //   icon: <Settings className="w-5 h-5" />
    // },
  ]

  const filteredNavItems = navItems.filter(item => {
    if (!item.requiresRole) return true
    if (item.requiresRole === 'restaurant_admin' && userRole === 2) return true
    if (item.requiresRole === 'super_admin' && userRole === 1) return true
    return false
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-all duration-300 ease-in-out
        bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl
      `}>
        {/* Logo Section */}
        <div className="relative h-16 flex items-center justify-between px-4 border-b border-gray-700">
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <QrCode className="w-8 h-8 text-indigo-400" />
            {!isCollapsed && (
              <span className="ml-3 font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                MenuQRGen
              </span>
            )}
          </div>
          
          {/* Collapse Button - Desktop Only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 rounded-full items-center justify-center border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center px-3 py-2.5 rounded-lg
                  transition-all duration-200 ease-in-out
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <span className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="
                    absolute left-full ml-2 px-2 py-1 
                    bg-gray-900 text-white text-sm rounded-md
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 whitespace-nowrap
                    shadow-lg z-50
                  ">
                    {item.label}
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-indigo-400 rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out Section */}
        <div className="p-4 border-t border-gray-700">
          <Link
            href="/auth/signout"
            className={`
              group flex items-center px-3 py-2.5 rounded-lg
              text-gray-300 hover:text-white hover:bg-red-600/20
              transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
            {!isCollapsed && (
              <span className="ml-3 font-medium">Sign Out</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="
                absolute left-full ml-2 px-2 py-1 
                bg-gray-900 text-white text-sm rounded-md
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 whitespace-nowrap
                shadow-lg
              ">
                Sign Out
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className={`
        flex-1 
        ${isMobileMenuOpen ? '' : 'lg:ml-0'}
        transition-all duration-300
      `}>
        {/* Top padding for mobile menu button */}
        <div className="lg:hidden h-16" />
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}