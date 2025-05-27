'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Check if we have a hash in the URL (Supabase appends the token as a hash)
  const hashParams = typeof window !== 'undefined' ? window.location.hash : ''
  
  useEffect(() => {
    // Process the hash to extract the token if it exists
    const handleHashParams = async () => {
      // The token could be in URL hash fragment (#access_token=...)
      if (hashParams && hashParams.includes('type=recovery')) {
        // Supabase will handle the token automatically
        setMessage('You can now set your new password.')
      } else if (!hashParams) {
        // No hash parameters found
        setError('No reset token found. Please request a new password reset link.')
      }
    }

    handleHashParams()
  }, [hashParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password,
      })
      
      if (error) {
        throw error
      }
      
      setMessage('Password updated successfully! Redirecting to login...')
      
      // Sign out the user since the password was changed
      await supabase.auth.signOut()
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
      
    } catch (error) {
      console.error('Error updating password:', error)
      setError(typeof error === 'object' && error !== null && 'message' in error 
        ? String(error.message) 
        : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-20 text-center">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-3xl font-bold">Reset Your Password</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-left">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div className="text-left">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <Link href="/auth/signin" className="text-sm text-indigo-600 hover:text-indigo-500">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}