import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getLocationById, updateLocation, deleteLocation } from '@/lib/locationService';
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
  { params }: { params: { restaurantId: string; locationId: string } }
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
    
    const location = await getLocationById(locationId);
    return NextResponse.json(location);
  } catch (error) {
    console.error('Error in GET location by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { restaurantId: string; locationId: string } }
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
    
    const updateData = await request.json();
    const location = await updateLocation(locationId, updateData);
    
    return NextResponse.json(location);
  } catch (error) {
    console.error('Error in PUT location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { restaurantId: string; locationId: string } }
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
    
    await deleteLocation(locationId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}