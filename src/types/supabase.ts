// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
   Tables: {
      restaurants: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          logo_url: string | null
          banner_url: string | null
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          logo_url?: string | null
          banner_url?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          banner_url?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          description?: string | null
          display_order: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      menu_items: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_available?: boolean
          display_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_available?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: string
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          role_id: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          role_id: number
        }
        Update: {
          id?: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          role_id?: number
        }
      }
    }
    // Views: {
    //   // Add views if any
    // }
    // Functions: {
    //   // Add functions if any
    // }
  }
}