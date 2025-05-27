    'use client';

import { useState } from 'react';
import { FiEye } from 'react-icons/fi';
import QRCodePreview from './QRCodePreview';

interface QRCodeViewerProps {
  restaurantSlug: string;
  restaurantName: string;
  locationSlug: string;
  locationName: string;
  menuSlug?: string;
  menuName?: string;
  targetUrl?: string;
}

export default function QRCodeViewer({
  restaurantSlug,
  restaurantName,
  locationSlug,
  locationName,
  menuSlug,
  menuName,
  targetUrl
}: QRCodeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 flex items-center gap-1"
        title="Preview this QR code"
      >
        <FiEye size={12} />
        <span>Preview</span>
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Preview QR Code for {locationName}
                {menuName ? ` - ${menuName}` : ''}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            {targetUrl && (
              <div className="mb-4 text-sm text-gray-500">
                <p>Target URL: {targetUrl}</p>
              </div>
            )}
            
            <QRCodePreview 
              restaurantSlug={restaurantSlug}
              restaurantName={restaurantName}
              locationSlug={locationSlug}
              locationName={locationName}
              menuSlug={menuSlug}
              menuName={menuName}
            />
          </div>
        </div>
      )}
    </>
  );
}