import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getMenusByLocationId, assignMenuToLocation } from '@/lib/locationMenuService';
import { Database } from '@/lib/database.types';

async function verifyLocationAccess(
  supabase: SupabaseClient<Database>, 
  locationId: string, 
  userId: string
) {
  const { data: location } = await supabase
    .from('locations')
    .select(`
      id,
      restaurants!inner(owner_id)
    `)
    .eq('id', locationId)
    .eq('restaurants.owner_id', userId)
    .maybeSingle();
  
  return !!location;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const {locationId} = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify access to this location
    const hasAccess = await verifyLocationAccess(supabase, locationId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const menus = await getMenusByLocationId(locationId);
    return NextResponse.json(menus);
  } catch (error) {
    console.error('Error in GET location menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location menus' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const {locationId} = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify access to this location
    const hasAccess = await verifyLocationAccess(supabase, locationId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { menuId } = await request.json();
    
    if (!menuId) {
      return NextResponse.json({ error: 'Menu ID is required' }, { status: 400 });
    }
    
    const locationMenu = await assignMenuToLocation(locationId, menuId);
    
    return NextResponse.json(locationMenu, { status: 201 });
  } catch (error) {
    console.error('Error in POST location menu:', error);
    return NextResponse.json(
      { error: 'Failed to assign menu to location' },
      { status: 500 }
    );
  }
}