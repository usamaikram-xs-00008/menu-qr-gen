// app/dashboard/layout.tsx
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
  Shield,
  //BarChart3,
  Building2,
  //UserCog
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  requiresSuperAdmin?: boolean
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
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
          
          setIsSuperAdmin(userProfile?.role_id === 1)
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
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="w-5 h-5" />
    },
    {
      label: 'Manage Restaurants',
      href: '/dashboard/restaurants',
      icon: <Building2 className="w-5 h-5" />
    },
    // {
    //   label: 'All Users',
    //   href: '/dashboard/users',
    //   icon: <Users className="w-5 h-5" />
    // },
    {
      label: 'Invite Staff',
      href: '/dashboard/staff/invite',
      icon: <UserPlus className="w-5 h-5" />,
      requiresSuperAdmin: true
    },
    // {
    //   label: 'Platform Analytics',
    //   href: '/dashboard/analytics',
    //   icon: <BarChart3 className="w-5 h-5" />
    // },
    // {
    //   label: 'Roles & Permissions',
    //   href: '/dashboard/roles',
    //   icon: <Shield className="w-5 h-5" />,
    //   requiresSuperAdmin: true
    // },
    // {
    //   label: 'Platform Settings',
    //   href: '/dashboard/settings',
    //   icon: <Settings className="w-5 h-5" />
    // },
  ]

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresSuperAdmin) return isSuperAdmin
    return true
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
            <div className="relative">
              <QrCode className="w-8 h-8 text-indigo-400" />
              <Shield className="w-4 h-4 text-purple-400 absolute -bottom-1 -right-1" />
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <span className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  MenuQRGen
                </span>
                <span className="block text-xs text-gray-400">Admin Portal</span>
              </div>
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

        {/* User Role Badge */}
        {isSuperAdmin && !isCollapsed && (
          <div className="px-4 py-3 border-b border-gray-700/50">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-300">Super Admin</span>
            </div>
          </div>
        )}

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

        {/* Quick Stats - Only for Super Admin */}
        {isSuperAdmin && !isCollapsed && (
          <div className="px-4 py-3 border-t border-gray-700/50">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Active Restaurants</span>
                <span className="text-gray-300 font-medium">--</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Total Users</span>
                <span className="text-gray-300 font-medium">--</span>
              </div>
            </div>
          </div>
        )}

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