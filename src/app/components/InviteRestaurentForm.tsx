// components/InviteRestaurentForm.tsx
'use client'

import { useState, FormEvent, ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase';

type MessageState = {
  type: 'success' | 'error' | '';
  text: string;
};

export default function InviteRestaurentForm() {
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ type: '', text: '' });
  
  const supabase = createClient();
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('You must be logged in');
      
      const response = await fetch('/api/invite-restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          admin_id: user.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      
      setMessage({ 
        type: 'success', 
        text: 'Invitation sent successfully!' 
      });
      setEmail('');
      
    } catch (error: unknown) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  return (
    <div className="max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">Invite Restaurant</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Email Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={handleEmailChange} 
            required 
            className="w-full p-2 border rounded"
            placeholder="email@example.com"
          />
          <p className="text-sm text-gray-500 mt-1">
            An invitation will be sent to this email address
          </p>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {isSubmitting ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
      
      {message.text && (
        <div className={`mt-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}