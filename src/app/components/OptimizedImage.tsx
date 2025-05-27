'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  size?: number; // For square images
  fill?: boolean;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  width,
  height,
  className = '',
  size,
  fill = false
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  
  // Return null if no image source
  if (!src || error) {
    return null;
  }

  // Handle fill layout
  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Handle square size
  if (size) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`h-${size} w-${size} object-contain ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  // Handle specified dimensions
  if (width && height) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={() => setError(true)}
      />
    );
  }

  // Fallback to a reasonable default size
  return (
    <Image
      src={src}
      alt={alt}
      width={100}
      height={100}
      className={`h-auto w-auto ${className}`}
      onError={() => setError(true)}
    />
  );
}