// components/SafeImage.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SafeImageProps {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
}

export default function SafeImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  fallbackSrc = 'https://placehold.co/600x400' 
}: SafeImageProps) {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }
  
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