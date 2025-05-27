// app/staff/register/page.tsx
"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { AuthError } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Define the invitation interface
interface Invitation {
  id: string;
  email: string;
  role_id: number;
  created_by_id: string;
  restaurant_id: string | null;
  token: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

export default function RegisterStaffPage() {
  const [fullName, setFullName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  // Fetch invitation details
  useEffect(() => {
    async function fetchInvitation() {
      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        setError("Invalid or expired invitation");
        setLoading(false);
        return;
      }

      setInvitation(data as Invitation);
      setEmail(data.email);
      setLoading(false);
    }

    fetchInvitation();
  }, [token]);

  const handleFullNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!invitation) {
        throw new Error("Invalid invitation");
      }
      debugger;
      const { data, error } = await supabaseAdmin.rpc("get_user_id_by_email", {
        email: invitation.email,
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to auth user");
      if (data.length === 0) {
                // 1. Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: invitation.email,
            password,
            options: {
              data: {
                display_name: fullName,
              },
            },
          }
        );
        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user");

        // 2. Create user profile with the correct role and created_by relationship
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: authData.user.id,
            role_id: invitation.role_id,
            created_by_id: invitation.created_by_id,
            is_active: true,
            restaurant_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            image_url: null,
          });

        if (profileError) throw profileError;
      } else {
        const user = data[0];
        // const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        //   user.id,
        //   {
        //     password,
        //     user_metadata: { display_name: fullName },
        //     email_confirm: true
        //   }
        // );
        const { error } = await supabaseAdmin.rpc("update_auth_user", {
            user_id: user.id,
            new_password: password,   
            display_name: fullName,
        });
        if (error) throw new Error("Failed to update auth user");

        const { error: profileError } = await supabase
          .from("user_profiles")
          .upsert({
            id: user.id,
            role_id: invitation.role_id,
            created_by_id: invitation.created_by_id,
            is_active: true,
          });

        if (profileError) throw new Error("Failed to create user profile");
      }

      // 3. Mark invitation as used
      await supabase
        .from("invitations")
        .update({ used: true })
        .eq("id", invitation.id);

      // 4. Redirect to login
      router.push("/auth/signin");
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Complete Your Registration</h1>
      <p className="mb-4">
        You&apos;ve been invited as staff to the QR Menu System
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={handleFullNameChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            minLength={8}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Complete Registration
        </button>
      </form>
    </div>
  );
}
