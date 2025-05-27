import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import type { Database } from '@/lib/database.types';

// Generate QR code for a restaurant by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Create server client
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
    
    // Check if id is a UUID (for ID lookup) or a string (for slug lookup)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let restaurant;
    let slug;
    
    if (isUuid) {
      // This is an ID-based lookup - requires authentication
      // Check for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Fetch restaurant by ID to get its slug
      const { data, error } = await supabase
        .from('restaurants')
        .select('slug, owner_id')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        );
      }
      
      restaurant = data;
      
      // Check ownership for ID-based lookups
      if (restaurant.owner_id !== session.user.id) {
        // Check if user is super admin
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('role_id')
          .eq('id', session.user.id)
          .single();
        
        // If not super admin and not the owner, deny access
        if (!userProfile || userProfile.role_id !== 1) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      }
      
      slug = restaurant.slug;
    } else {
      // This is a slug-based lookup - no authentication required
      // Fetch restaurant by slug
      const { data, error } = await supabase
        .from('restaurants')
        .select('slug')
        .eq('slug', id)
        .eq('is_active', true) // Only return active restaurants for public access
        .single();
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Restaurant not found or inactive' },
          { status: 404 }
        );
      }
      
      slug = data.slug;
    }
    
    // Generate the menu URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.headers.get('host')}`;
    const menuUrl = `${baseUrl}/${slug}`;
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Return the QR code data URL and the menu URL
    return NextResponse.json({
      qrCode: qrDataUrl,
      menuUrl
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}