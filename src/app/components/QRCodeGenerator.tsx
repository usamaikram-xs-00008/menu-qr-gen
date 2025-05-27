// Updated QRCodeGenerator.tsx
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

interface QRCodeGeneratorProps {
  // Updated props to match how it's used in page.tsx
  url: string;
  restaurantName: string;
  
  // Optional props for more specific use cases
  locationName?: string;
  menuName?: string;
}

export default function QRCodeGenerator({ 
  url, 
  restaurantName,
  locationName,
  menuName
}: QRCodeGeneratorProps) {
  const [qrImage, setQrImage] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  
  // Generate QR code when component mounts or URL changes
  useEffect(() => {
    generateQR();
  }, [url]);
  
  const generateQR = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrImage(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    }
  };
  
  // Create a meaningful filename for the downloaded QR
  const getFileName = () => {
    let fileName = restaurantName.replace(/\s+/g, '-');
    
    if (locationName) {
      fileName += `-${locationName.replace(/\s+/g, '-')}`;
    }
    
    if (menuName) {
      fileName += `-${menuName.replace(/\s+/g, '-')}`;
    }
    
    return `${fileName}-qr.png`;
  };
  
  const downloadQR = () => {
    if (!qrImage) return;
    
    setDownloading(true);
    
    try {
      const link = document.createElement('a');
      link.href = qrImage;
      link.download = getFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  };
  
  const shareViaWhatsApp = () => {
    if (!url) return;
    
    const message = `Check out our menu: ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <div>
      {!qrImage ? (
        <div className="text-center p-4">
          <p>Generating QR code...</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4 bg-white p-4 inline-block rounded-lg shadow">
            <Image 
              src={qrImage} 
              alt="Menu QR Code" 
              className="mx-auto" 
              width={300} 
              height={300}
            />
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            <p>This QR code links to: <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a></p>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={downloadQR}
              disabled={downloading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {downloading ? 'Downloading...' : 'Download QR'}
            </button>
            
            <button 
              onClick={shareViaWhatsApp}
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Share via WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}