'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const bgColor = 
    type === 'success' ? 'bg-green-50 border-green-500' : 
    type === 'error' ? 'bg-red-50 border-red-500' : 
    'bg-blue-50 border-blue-500';
  
  const textColor = 
    type === 'success' ? 'text-green-800' : 
    type === 'error' ? 'text-red-800' : 
    'text-blue-800';
  
  const Icon = 
    type === 'success' ? FiCheckCircle : 
    type === 'error' ? FiAlertTriangle : 
    FiCheckCircle;
  
  return (
    <div 
      className={`fixed bottom-4 right-4 flex items-center ${bgColor} border-l-4 p-3 rounded shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      role="alert"
    >
      <Icon className={`mr-2 ${textColor}`} />
      <span className={textColor}>{message}</span>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-4 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        <FiX />
      </button>
    </div>
  );
}