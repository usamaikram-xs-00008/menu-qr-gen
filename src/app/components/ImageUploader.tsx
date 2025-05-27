// app/components/ImageUploader.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface ImageUploaderProps {
  bucketName: string;
  folderPath: string;
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string | null;
  aspectRatio?: string; // e.g., '16:9', '1:1', '4:3'
}

export default function ImageUploader({ 
  bucketName, 
  folderPath, 
  onUploadComplete, 
  currentImageUrl,
  aspectRatio = '1:1'
}: ImageUploaderProps) {
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Fixed: TypeScript error for preview state initialization
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)

  // Calculate aspect ratio padding
  const getPaddingBottom = () => {
    if (!aspectRatio) return '100%';
    const [width, height] = aspectRatio.split(':').map(Number);
    return `${(height / width) * 100}%`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create a local preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl) // Fixed: Now correctly typed

      // Generate a unique filename
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${folderPath}/${fileName}`

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        setUploadError('You need to be logged in to upload images')
        setIsUploading(false)
        return
      }
      //console.log("User is authenticated as:", sessionData.session.user.email)

      // Upload to Supabase Storage
      const { error } = await supabase.storage // Fixed: Removed unused 'data'
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })
      if (error) throw error

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      // Call the callback with the new URL
      onUploadComplete(publicUrlData.publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadError('Failed to upload image. Please try again.')
      setPreview(currentImageUrl || null) // Fixed: Now correctly typed
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div 
        className="relative border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
        style={{ paddingBottom: getPaddingBottom() }}
      >
        {preview ? (
          // Using a div with background-image instead of img for better aspect ratio control
          <div 
            className="absolute inset-0 bg-cover bg-center rounded-lg" 
            style={{ backgroundImage: `url(${preview})` }}
            aria-label="Image preview"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm">Click or drag to upload image</p>
          </div>
        )}
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      
      {isUploading && (
        <div className="text-sm text-blue-600">Uploading...</div>
      )}
      
      {uploadError && (
        <div className="text-sm text-red-600">{uploadError}</div>
      )}
    </div>
  )
}