import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getMenuById, updateMenu, deleteMenu, reorderMenu } from '@/lib/menuService';
import { Database } from '@/lib/database.types';

async function verifyMenuAccess(
  supabase: SupabaseClient<Database>, 
  menuId: string, 
  userId: string
) {
  const { data: menu } = await supabase
    .from('menus')
    .select(`
      id,
      restaurants!inner(owner_id)
    `)
    .eq('id', menuId)
    .eq('restaurants.owner_id', userId)
    .maybeSingle();
  
  return !!menu;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { restaurantId: string; menuId: string } }
) {
  try {
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
    
    // Verify access to this menu
    const hasAccess = await verifyMenuAccess(supabase, params.menuId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const menu = await getMenuById(params.menuId);
    return NextResponse.json(menu);
  } catch (error) {
    console.error('Error in GET menu by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { restaurantId: string; menuId: string } }
) {
  try {
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
    
    // Verify access to this menu
    const hasAccess = await verifyMenuAccess(supabase, params.menuId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const updateData = await request.json();
    
    // Check if this is a reorder request
    if (updateData.action === 'reorder' && updateData.direction) {
      const menu = await reorderMenu(params.menuId, updateData.direction);
      return NextResponse.json(menu);
    }
    
    // Otherwise, it's a regular update
    const menu = await updateMenu(params.menuId, updateData);
    return NextResponse.json(menu);
  } catch (error) {
    console.error('Error in PUT menu:', error);
    return NextResponse.json(
      { error: 'Failed to update menu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { restaurantId: string; menuId: string } }
) {
  try {
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
    
    // Verify access to this menu
    const hasAccess = await verifyMenuAccess(supabase, params.menuId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await deleteMenu(params.menuId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE menu:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}