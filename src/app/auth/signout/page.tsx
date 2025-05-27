// app/auth/signout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { FiLoader } from 'react-icons/fi';

export default function SignOut() {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function handleSignOut() {
      try {
        const supabase = createClient();
        
        // Sign out from Supabase
        const { error: signOutError } = await supabase.auth.signOut();
        
        if (signOutError) throw signOutError;
        
        // Clear any local storage items related to auth
        localStorage.removeItem('supabase.auth.token');
        
        // Use a hard redirect instead of the Next.js router to ensure a full page refresh
        // This forces the browser to completely reload and re-check auth state
        window.location.href = '/auth/signin';
      } catch (err) {
        console.error('Sign out error:', err);
        setError('Failed to sign out. Please try again.');
      }
    }
    
    handleSignOut();
  }, []); 
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <div className="w-full max-w-md">
          {error ? (
            <>
              <h1 className="mb-6 text-3xl font-bold">Error</h1>
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => window.location.href = '/auth/signin'}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              >
                Go to Sign In
              </button>
            </>
          ) : (
            <>
              <h1 className="mb-6 text-3xl font-bold">Signing out...</h1>
              <div className="flex justify-center">
                <FiLoader className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}