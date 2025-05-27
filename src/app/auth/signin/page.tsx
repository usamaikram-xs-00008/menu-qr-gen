'use client'

import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function SignIn() {
  const router = useRouter()
  const supabase = createClient()
  const [origin, setOrigin] = useState('')

  useEffect(() => {
  setOrigin(window.location.origin)
  
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      try {
        // Check user role
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role_id')
          .eq('id', session.user.id)
          .single()
          
        if (profileError) throw profileError
        
        // Redirect based on role
        if (userProfile.role_id === 1) {
          // Super Admin
          router.push('/dashboard')
        } else if (userProfile.role_id === 2) {
          // Restaurant Owner - check if profile is complete
          const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id')
            .eq('owner_id', session.user.id)
            .maybeSingle()
            
          if (restaurantError) throw restaurantError
          
          if (!restaurant) {
            // Profile not complete, redirect to complete profile
            router.push('/complete-profile')
          } else {
            // Profile complete, go to restaurant dashboard
            router.push('/me')
          }
        } else {
          // Unknown role, use fallback
          router.push('/me')
        }
      } catch (error) {
        console.error('Error during sign-in redirection:', error)
        // Fallback redirect
        router.push('/me')
      }
    }
  })

  return () => {
    subscription.unsubscribe()
  }
}, [router, supabase])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-3xl font-bold">Sign in to MenuQRGen</h1>
          {origin && (
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              redirectTo={`${origin}/dashboard`}
              showLinks={false}
            />
          )}
        </div>
      </main>
    </div>
  )
}