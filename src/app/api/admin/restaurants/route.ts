// app/api/admin/restaurants/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  try {
    // Check authentication and authorization
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is super admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()
    
    if (profileError || !userProfile || userProfile.role_id !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get all restaurants
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, owner_id(*)')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ restaurants: data })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurants'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}