// app/api/admin/restaurants/[id]/toggle/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
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
  
  try {
    // Get the request body
    const { isActive } = await request.json()
    
    // Update restaurant status
    const { data, error } = await supabase
      .from('restaurants')
      .update({ is_active: isActive })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ restaurant: data })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to toggle restaurant status'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}