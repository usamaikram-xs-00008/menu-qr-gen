'use client';

import Image from 'next/image';
import { FiDownload, FiShare2, FiTrash2 } from 'react-icons/fi';
import QRCodeToggle from './QRCodeToggle';
import { Database } from '@/lib/database.types';

// Use types from database.types.ts
type Location = Database['public']['Tables']['locations']['Row'];
type Menu = Database['public']['Tables']['menus']['Row'];

// Define a proper interface for QR codes with all required properties
interface QRCodeType {
  id: string;
  location_id: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  url?: string;        // Optional for custom properties
  menu_id?: string;    // Optional for menu association
}

interface QRCodeCardProps {
  qrCode: QRCodeType;
  location: Location;
  menuAssignments: Array<{id: string, menu_id: string, is_active: boolean, menus: Menu}>;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
  onToggle: (newStatus: boolean) => Promise<void>;
}

export default function QRCodeCard({
  qrCode,
  location,
  menuAssignments,
  onDownload,
  onShare,
  onDelete,
  onToggle
}: QRCodeCardProps) {
  // Find menu name if this QR links to a specific menu
  const menuName = qrCode.menu_id 
    ? menuAssignments.find(am => am.menus.id === qrCode.menu_id)?.menus?.name 
    : null;
  
  // Format the QR code URL for display
  const displayUrl = qrCode.url 
    ? new URL(qrCode.url).pathname 
    : null;
  
  return (
    <div 
      className={`border rounded-lg p-4 ${
        qrCode.is_active ? 'bg-white' : 'bg-gray-50 opacity-75'
      } relative`}
    >
      {/* Type indicator - show prominently what this QR links to */}
      <div className="absolute top-2 right-2">
        <span className={`text-xs px-2 py-1 rounded-full ${
          menuName 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {menuName ? 'Menu QR' : 'Location QR'}
        </span>
      </div>
      
      <div className="flex justify-center mb-3 relative pt-6">
        <div className="relative">
          <Image 
            src={qrCode.image_url} 
            alt="QR Code" 
            width={150} 
            height={150}
            className={`border rounded ${!qrCode.is_active && 'opacity-50'}`}
          />
          
          {/* Show a subtle overlay with menu info if this is a menu-specific QR */}
          {/* {menuName && (
            <div className="absolute bottom-0 left-0 right-0 bg-purple-600 bg-opacity-80 text-white text-xs py-1 px-2 truncate">
              {menuName}
            </div>
          )} */}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-center mb-2">
          <QRCodeToggle
            qrCodeId={qrCode.id}
            isActive={qrCode.is_active}
            onToggle={(id, newStatus) => onToggle(newStatus)}
            disabled={!location.is_active}
          />
        </div>
        
        {/* Show URL path the QR points to */}
        {displayUrl && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-hidden">
            <div className="truncate">
              Path: <code className="text-xs">{displayUrl}</code>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 text-center">
          Created: {new Date(qrCode.created_at).toLocaleDateString()}
        </p>
        
        <div className="flex justify-center space-x-2">
          <button
            onClick={onDownload}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            title="Download QR Code"
          >
            <FiDownload size={16} />
          </button>
          <button
            onClick={onShare}
            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
            title="Share via WhatsApp"
          >
            <FiShare2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
            title="Delete QR Code"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}