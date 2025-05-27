// app/api/admin/restaurants/[id]/categories/route.ts
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest, 
  { params }: RouteParams
) {
  const { id } = params;
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

  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', id)
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest, 
  { params }: RouteParams
) {
  const { id } = params;
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
  const requestData = await request.json();

  try {
    // Get the max display_order for the restaurant's categories
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('menu_categories')
      .select('display_order')
      .eq('restaurant_id', id)
      .order('display_order', { ascending: false })
      .limit(1);

    if (maxOrderError) {
      return NextResponse.json({ error: maxOrderError.message }, { status: 500 });
    }

    const maxOrder = maxOrderData?.length ? maxOrderData[0].display_order : 0;

    const newCategory = {
      ...requestData,
      restaurant_id: id,
      display_order: maxOrder + 1,
      is_active: true
    };

    const { data, error } = await supabase
      .from('menu_categories')
      .insert([newCategory])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}