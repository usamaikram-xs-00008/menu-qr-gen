'use client';

import { useState, useEffect } from 'react';
import { FiToggleLeft, FiToggleRight } from 'react-icons/fi';

interface QRCodeToggleProps {
  qrCodeId: string;
  isActive: boolean;
  onToggle: (id: string, newStatus: boolean) => Promise<void>;
  disabled?: boolean;
}

export default function QRCodeToggle({ 
  qrCodeId, 
  isActive, 
  onToggle,
  disabled = false
}: QRCodeToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(isActive);
  
  // Update local state when prop changes
  useEffect(() => {
    setCurrentStatus(isActive);
  }, [isActive]);
  
  const handleToggle = async () => {
    if (isUpdating || disabled) return;
    
    setIsUpdating(true);
    try {
      await onToggle(qrCodeId, !currentStatus);
      setCurrentStatus(!currentStatus);
    } catch (error) {
      console.error('Failed to toggle QR code status:', error);
      // Status will be reverted because we don't update currentStatus
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating || disabled}
      className={`flex items-center px-2 py-1 rounded text-xs ${
        isUpdating || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
      }`}
      title={currentStatus ? 'Deactivate QR code' : 'Activate QR code'}
    >
      {currentStatus ? (
        <>
          <FiToggleRight className="text-green-500 w-5 h-5 mr-1" />
          <span className="text-green-600">Active</span>
        </>
      ) : (
        <>
          <FiToggleLeft className="text-gray-500 w-5 h-5 mr-1" />
          <span className="text-gray-600">Inactive</span>
        </>
      )}
    </button>
  );
}