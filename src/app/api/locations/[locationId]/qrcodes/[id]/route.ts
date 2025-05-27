// app/api/locations/[locationId]/qrcodes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js'; // Import from supabase-js instead
import { cookies } from 'next/headers';
import { getQRCodeById, deleteQRCode } from '@/lib/qrCodeService';
import { Database } from '@/lib/database.types';

type AccessCheckResult = {
  authorized: boolean;
  error?: string;
  status?: number;
};

// Helper function to verify QR code access
async function verifyQRCodeAccess(
  supabase: SupabaseClient<Database>,
  qrCodeId: string,
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
  
  // Get the QR code to verify it belongs to the specified location
  try {
    const qrCode = await getQRCodeById(qrCodeId);
    
    if (!qrCode) {
      return { authorized: false, error: "QR code not found", status: 404 };
    }
    
    if (qrCode.location_id !== locationId) {
      return { authorized: false, error: "QR code does not belong to this location", status: 403 };
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
      return { authorized: false, error: "Not authorized to access this QR code", status: 403 };
    }
    
    return { authorized: true };
  } catch (error) {
    console.error("Error verifying QR code access:", error);
    return { authorized: false, error: "Failed to verify access", status: 500 };
  }
}

// DELETE /api/locations/:locationId/qrcodes/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { locationId: string, id: string } }
) {
  try {
    const { locationId, id: qrCodeId } = params;
    
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
    
    // Verify QR code access
    const accessCheck = await verifyQRCodeAccess(supabase, qrCodeId, locationId, session.user.id);
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }
    
    // Delete QR code
    await deleteQRCode(qrCodeId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return NextResponse.json(
      { error: "Failed to delete QR code" },
      { status: 500 }
    );
  }
}

// PUT /api/locations/:locationId/qrcodes/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { locationId: string; id: string } }
) {
  try {
    const { locationId, id } = params;
    const { isActive } = await req.json();
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Verify user authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the location exists and belongs to the user's restaurant
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('restaurant_id')
      .eq('id', locationId)
      .single();
    
    if (locationError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    // Get the user's restaurant
    const { data: userRestaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();
    
    if (restaurantError || !userRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (location.restaurant_id !== userRestaurant.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update QR code status
    const { data: qrCode, error: qrCodeError } = await supabase
      .from('qr_codes')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('location_id', locationId)
      .select()
      .single();
    
    if (qrCodeError) {
      console.error('Error updating QR code:', qrCodeError);
      return NextResponse.json({ error: 'Failed to update QR code status' }, { status: 500 });
    }
    
    return NextResponse.json(qrCode);
  } catch (error) {
    console.error('Error in PUT /api/locations/[locationId]/qrcodes/[qrCodeId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}