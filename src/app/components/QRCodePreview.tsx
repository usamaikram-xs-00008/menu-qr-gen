'use client';

import { useState, useEffect } from 'react';
import { FiSmartphone, FiX, FiRefreshCw } from 'react-icons/fi';

type QRCodePreviewProps = {
  // Required props
  restaurantSlug: string;
  restaurantName: string;
  
  // Optional props for specific previews
  locationSlug?: string;
  locationName?: string;
  menuSlug?: string;
  menuName?: string;
  
  // Available menus for selection
  availableMenus?: Array<{id: string, slug: string, name: string}>;
};

export default function QRCodePreview({ 
  restaurantSlug,
  restaurantName,
  locationSlug,
  locationName,
  menuSlug,
  menuName,
  availableMenus = []
}: QRCodePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'location' | 'menu'>(
    menuSlug ? 'menu' : 'location'
  );
  const [selectedMenuSlug, setSelectedMenuSlug] = useState(menuSlug || '');
  const [iframeKey, setIframeKey] = useState(0); // For forcing iframe refresh
  
  // Update selectedMenuSlug when menuSlug prop changes
  useEffect(() => {
    if (menuSlug) {
      setSelectedMenuSlug(menuSlug);
      setPreviewType('menu');
    } else {
      setPreviewType('location');
    }
  }, [menuSlug]);
  
  // Get the base URL from window location
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const { protocol, host } = window.location;
      return `${protocol}//${host}`;
    }
    return '';
  };
  
  // Generate the proper menu URL based on the type and selections
  const getMenuUrl = () => {
    const base = getBaseUrl();
    
    if (previewType === 'menu' && selectedMenuSlug && locationSlug) {
      return `${base}/menus/${restaurantSlug}/${locationSlug}/${selectedMenuSlug}`;
    } else if (locationSlug) {
      return `${base}/menus/${restaurantSlug}/${locationSlug}`;
    } else {
      return `${base}/menus/${restaurantSlug}`;
    }
  };
  
  const menuUrl = getMenuUrl();
  
  // Generate a title for the preview
  const getPreviewTitle = () => {
    let title = restaurantName;
    
    if (locationName) {
      title += ` - ${locationName}`;
    }
    
    if (previewType === 'menu' && selectedMenuSlug) {
      // Find the selected menu name
      const menu = availableMenus.find(m => m.slug === selectedMenuSlug);
      if (menu) {
        title += ` - ${menu.name}`;
      } else if (menuName) {
        title += ` - ${menuName}`;
      }
    }
    
    return title;
  };
  
  // Refresh the iframe content
  const refreshPreview = () => {
    setIframeKey(prevKey => prevKey + 1);
  };
  
  return (
    <>
      <div className="space-y-4">
        {/* Menu type selector - only show if we have available menus */}
        {availableMenus.length > 0 && (
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium mb-1">Preview Type:</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="previewType"
                  value="location"
                  checked={previewType === 'location'}
                  onChange={() => setPreviewType('location')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">All Menus</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="previewType"
                  value="menu"
                  checked={previewType === 'menu'}
                  onChange={() => setPreviewType('menu')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Specific Menu</span>
              </label>
            </div>
          </div>
        )}
        
        {/* Menu selector dropdown */}
        {previewType === 'menu' && availableMenus.length > 0 && (
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium mb-1">Select Menu:</label>
            <select
              value={selectedMenuSlug}
              onChange={(e) => setSelectedMenuSlug(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a menu</option>
              {availableMenus.map((menu) => (
                <option key={menu.id} value={menu.slug}>
                  {menu.name}
                </option>
              ))}
            </select>
          </div>
        )}
      
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          <FiSmartphone className="mr-2" />
          Preview Mobile Menu
        </button>
        
        <div className="text-sm text-gray-500 mt-2">
          <p>Preview URL: {menuUrl}</p>
        </div>
      </div>
      
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-sm w-full h-[600px] shadow-lg">
            {/* Modern phone frame with notch */}
            <div className="absolute inset-0 pointer-events-none border-8 border-gray-800 rounded-3xl"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-gray-800 rounded-b-xl z-20"></div>
            
            {/* Header with title, refresh and close buttons */}
            <div className="absolute top-0 inset-x-0 bg-gray-800 text-white z-10 px-4 py-2 flex justify-between items-center">
              <span className="text-sm truncate">{getPreviewTitle()}</span>
              <div className="flex space-x-2">
                <button 
                  onClick={refreshPreview}
                  className="text-white hover:text-gray-300 transition focus:outline-none"
                  title="Refresh preview"
                >
                  <FiRefreshCw size={16} />
                </button>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-white hover:text-gray-300 transition focus:outline-none"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
            
            {/* Status bar */}
            <div className="absolute top-10 inset-x-0 bg-black text-white text-xs px-4 py-1 flex justify-between">
              <span>5:22 PM</span>
              <div className="flex space-x-2">
                <span>4G</span>
                <span>100%</span>
              </div>
            </div>
            
            {/* Menu iframe */}
            <iframe
              key={iframeKey}
              src={menuUrl}
              className="w-full h-full pt-16"
              title={`${getPreviewTitle()} Preview`}
            />
          </div>
        </div>
      )}
    </>
  );
}