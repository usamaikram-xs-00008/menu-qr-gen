import { createClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/lib/database.types';

type QRCode = Database['public']['Tables']['qr_codes']['Row'];
type InsertQRCode = Database['public']['Tables']['qr_codes']['Insert'];
type UpdateQRCode = Database['public']['Tables']['qr_codes']['Update'];

// Menu object from join query
interface MenuData {
  id: string;
  name: string;
  slug: string;
}

// Extended QRCode type with optional menu information
export interface QRCodeWithMenu extends QRCode {
  menu_id?: string | null;
  menu_name?: string | null;
  menu_slug?: string | null;
}

export async function getQRCodesByLocationId(locationId: string): Promise<QRCodeWithMenu[]> {
  const supabase = createClient();
  
  // First try to get QR codes with menu information
  const { data: qrCodesWithMenu, error: menuError } = await supabase
    .from('qr_codes')
    .select(`
      *,
      menus:menu_id (
        id,
        name,
        slug
      )
    `)
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });
  
  if (menuError) {
    // If the extended query fails (maybe menu_id column doesn't exist yet), 
    // fall back to the basic query
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as QRCodeWithMenu[];
  }
  
  // Transform the data to include menu information directly in the QR code object
  return qrCodesWithMenu.map(qrCode => {
    // Check if menu exists and properly type it
    const menu = qrCode.menus as MenuData | null;
    return {
      ...qrCode,
      menus: undefined, // Remove the nested menus object
      menu_id: menu?.id || null,
      menu_name: menu?.name || null,
      menu_slug: menu?.slug || null
    };
  });
}

export async function getQRCodeById(id: string): Promise<QRCode | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as QRCode;
}

type QRCodeInput = Omit<InsertQRCode, 'id'> & { menu_id?: string | null };

export async function createQRCode(qrCode: QRCodeInput): Promise<QRCode> {
  const supabase = createClient();
  
  // Check if menu_id exists in the table schema
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .insert([{
        id: uuidv4(),
        ...qrCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as QRCode;
  } catch (error) {
    // Check if error is an object with message property
    const errorObj = error as { message?: string };
    
    // If the error is related to menu_id column not existing, try without it
    if (errorObj.message?.includes('menu_id')) {
      // Create a new object omitting menu_id without destructuring
      const qrCodeWithoutMenu = { ...qrCode };
      // Delete the menu_id property instead of destructuring it
      delete qrCodeWithoutMenu.menu_id;
      
      const { data, error: retryError } = await supabase
        .from('qr_codes')
        .insert([{
          id: uuidv4(),
          ...qrCodeWithoutMenu,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (retryError) throw retryError;
      return data as QRCode;
    }
    
    throw error;
  }
}

type QRCodeUpdateInput = UpdateQRCode & { menu_id?: string | null };

export async function updateQRCode(id: string, updates: QRCodeUpdateInput): Promise<QRCode> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as QRCode;
  } catch (error) {
    // Check if error is an object with message property
    const errorObj = error as { message?: string };
    
    // If the error is related to menu_id column not existing, try without it
    if (errorObj.message?.includes('menu_id')) {
      // Create a new object omitting menu_id without destructuring
      const updatesWithoutMenu = { ...updates };
      // Delete the menu_id property instead of destructuring it
      delete updatesWithoutMenu.menu_id;
      
      const { data, error: retryError } = await supabase
        .from('qr_codes')
        .update({
          ...updatesWithoutMenu,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (retryError) throw retryError;
      return data as QRCode;
    }
    
    throw error;
  }
}

export async function deleteQRCode(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Update in qrCodeService.ts
export async function toggleQRCodeStatus(id: string, isActive: boolean) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('qr_codes')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as QRCode;
}