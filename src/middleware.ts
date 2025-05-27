// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          return req.cookies.get(name)?.value
        },
        set: (name, value, options) => {
          res.cookies.set({
            name,
            value,
            ...options
          })
        },
        remove: (name, options) => {
          res.cookies.set({
            name,
            value: '',
            ...options
          })
        }
      }
    }
  )
  
  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Allow access to signout route even if authenticated
  if (req.nextUrl.pathname === '/auth/signout') {
    return res
  }

  // Allow access to staff registration page with valid token
  if (req.nextUrl.pathname.startsWith('/staff/register') && req.nextUrl.searchParams.has('token')) {
    return res
  }

  // If user is signed in and trying to access auth pages, redirect based on role
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()
    
    // Redirect based on role
    if (userProfile) {
      if (userProfile.role_id === 1 || userProfile.role_id === 3) {
        // Super Admin or Super Admin Staff -> dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } else {
        // Restaurant Owner or Restaurant Staff -> me
        return NextResponse.redirect(new URL('/me', req.url))
      }
    }
  }

  // If user is not signed in and trying to access protected pages, redirect to login
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') || 
    req.nextUrl.pathname.startsWith('/me') ||
    req.nextUrl.pathname.startsWith('/staff')
  )) {
    // Exclude the staff registration page from this check
    if (!req.nextUrl.pathname.startsWith('/staff/register')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  // Check for Super Admin or Super Admin Staff role if accessing dashboard pages
  if (session && req.nextUrl.pathname.startsWith('/dashboard')) {
    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()
    
    // If not a Super Admin or Super Admin Staff, redirect to /me
    if (!userProfile || (userProfile.role_id !== 1 && userProfile.role_id !== 3)) {
      return NextResponse.redirect(new URL('/me', req.url))
    }
  }

  // Check for Restaurant Owner or Restaurant Staff role if accessing /me pages
  if (session && req.nextUrl.pathname.startsWith('/me')) {
    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()
    
    // If Super Admin or Super Admin Staff, redirect to dashboard
    if (userProfile && (userProfile.role_id === 1 || userProfile.role_id === 3)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Staff management permissions
  if (session && req.nextUrl.pathname.includes('/staff/invite')) {
    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()
    
    // Only admins (not staff) can invite new staff
    if (!userProfile || (userProfile.role_id !== 1 && userProfile.role_id !== 2)) {
      // Redirect staff users to their appropriate area
      if (userProfile && userProfile.role_id === 3) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } else if (userProfile && userProfile.role_id === 4) {
        return NextResponse.redirect(new URL('/me', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/me/:path*',
    '/auth/:path*',
    '/staff/:path*',
  ],
}