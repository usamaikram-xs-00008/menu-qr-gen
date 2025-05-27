// app/api/locations/[locationId]/qrcodes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getQRCodesByLocationId, createQRCode } from '@/lib/qrCodeService';
import { Database } from '@/lib/database.types';

type AccessCheckResult = {
  authorized: boolean;
  error?: string;
  status?: number;
};

// Helper function to verify location access
async function verifyLocationAccess(
  supabase: SupabaseClient<Database>,
  locationId: string,
  userId: string
): Promise<AccessCheckResult> {
  // Check if user is super admin
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role_id')
    .eq('id', userId)
    .single();
  
  if (!userProfile) {
    return { authorized: false, error: "User profile not found", status: 404 };
  }
  
  const isSuperAdmin = userProfile.role_id === 1;
  
  if (isSuperAdmin) {
    return { authorized: true };
  }
  
  // Check if location belongs to user's restaurant
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('restaurant_id')
    .eq('id', locationId)
    .single();
  
  if (locationError || !location) {
    return { authorized: false, error: "Location not found", status: 404 };
  }
  
  // Check if restaurant belongs to user
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', location.restaurant_id)
    .eq('owner_id', userId)
    .single();
  
  if (restaurantError || !restaurant) {
    return { authorized: false, error: "Not authorized to access this location", status: 403 };
  }
  
  return { authorized: true };
}

// GET /api/locations/:locationId/qrcodes
export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const {locationId} = await params;
    
    // Create server supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
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
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Verify location access
    const accessCheck = await verifyLocationAccess(supabase, locationId, session.user.id);
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }
    
    // Get QR codes for the location
    const qrCodes = await getQRCodesByLocationId(locationId);
    
    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json(
      { error: "Failed to fetch QR codes" },
      { status: 500 }
    );
  }
}

// POST /api/locations/:locationId/qrcodes
export async function POST(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    // Fix: Await the locationId parameter
    const {locationId} = await params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.image_url) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }
    
    // Create server supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
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
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Verify location access
    const accessCheck = await verifyLocationAccess(supabase, locationId, session.user.id);
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }
    
    // Create QR code
    const qrCode = await createQRCode({
      location_id: locationId,
      image_url: body.image_url,
      is_active: body.is_active !== undefined ? body.is_active : true,
      menu_id: body.menu_id || null,
    });
    return NextResponse.json(qrCode);
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json(
      { error: "Failed to create QR code" },
      { status: 500 }
    );
  }
}