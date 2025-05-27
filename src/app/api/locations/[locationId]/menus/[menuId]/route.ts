import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { removeMenuFromLocation, toggleLocationMenuStatus } from '@/lib/locationMenuService';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { locationId: string; menuId: string } }
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
    
    const { isActive, relationId } = await request.json();
    
    if (typeof isActive !== 'boolean' || !relationId) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    const locationMenu = await toggleLocationMenuStatus(relationId, isActive);
    
    return NextResponse.json(locationMenu);
  } catch (error) {
    console.error('Error in PUT location menu status:', error);
    return NextResponse.json(
      { error: 'Failed to update menu status at location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { locationId: string; menuId: string } }
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
    
    await removeMenuFromLocation(locationId, params.menuId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE location menu:', error);
    return NextResponse.json(
      { error: 'Failed to remove menu from location' },
      { status: 500 }
    );
  }
}