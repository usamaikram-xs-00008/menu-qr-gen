// app/api/invite-restaurant/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Type for the request body
interface InvitationRequest {
  email: string;
  admin_id: string;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, admin_id }: InvitationRequest = await request.json();
    console.log("Received invitation request:", { email, admin_id });
    
    // Initialize admin Supabase client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    // Get admin details
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('user_profiles')
      .select('role_id')
      .eq('id', admin_id)
      .single();
    
    console.log("Admin data query result:", { adminData, adminError });
    
    // Handle query errors
    if (adminError) {
      console.error("Error fetching admin data:", adminError);
      return NextResponse.json(
        { error: `Error verifying admin status: ${adminError.message}` }, 
        { status: 500 }
      );
    }
    
    // Check if user is an admin (role_id 1)
    if (!adminData || ![1].includes(adminData.role_id)) {
      console.log("Admin check failed:", { adminData });
      return NextResponse.json(
        { error: 'Only admins can invite staff' }, 
        { status: 403 }
      );
    }

    
    // Get restaurant_id if the user is a restaurant admin
    const restaurant_id = null;

    // Generate secure token for the invitation (standardized as lowercase)
    const token = crypto.randomBytes(20).toString('hex').toLowerCase();
    console.log("Generated token (exact):", token, "Length:", token.length);
    
    // Store invitation in database
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email,
        role_id: 2,
        created_by_id: admin_id,
        restaurant_id,
        token,
        used: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      })
      .select();
    
    console.log("Insert result:", insertData, insertError);
    
    if (insertError) {
      console.error("Error creating invitation:", insertError);
      return NextResponse.json(
        { error: `Error creating invitation: ${insertError.message}` }, 
        { status: 500 }
      );
    }
    
    // Get the site URL from environment variables
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      throw new Error('NEXT_PUBLIC_SITE_URL environment variable not set');
    }
    
    // Generate redirect URL for the invitation email (with token)
    const redirectUrl = `${siteUrl}/restaurant/register?token=${token}`;
    console.log("Redirect URL:", redirectUrl);
    
    // Send email using Supabase Auth's email service with token in metadata
    const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        invitation_token: token,
        restaurent_role_id: 2,
        created_by_id: admin_id
      }
    });
    
    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      
      // Delete the invitation record if email fails
      await supabaseAdmin
        .from('invitations')
        .delete()
        .eq('token', token);
        
      throw new Error(`Failed to send invitation: ${emailError.message}`);
    }
    
    console.log("Invitation successfully created and email sent");
    
    return NextResponse.json({ 
      success: true,
      message: `Invitation sent to ${email}` 
    });
    
  } catch (err: unknown) {
    console.error('Error creating staff invitation:', err);
    
    // Properly handle the unknown error type
    const errorMessage = err instanceof Error 
      ? err.message 
      : 'An unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}