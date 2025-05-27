'use client';

import { useState } from 'react';
import { FiHelpCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function QRCodeHelp() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="mb-6 border rounded-lg bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 focus:outline-none"
      >
        <div className="flex items-center">
          <FiHelpCircle className="text-blue-600 mr-2" />
          <h3 className="font-medium">QR Code Help & Best Practices</h3>
        </div>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 text-sm text-gray-700 border-t">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Types of QR Codes</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-medium">Location QR:</span> Shows all menus available at this location</li>
                <li><span className="font-medium">Menu QR:</span> Links directly to a specific menu</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Managing QR Codes</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Use the toggle to activate/deactivate QR codes</li>
                <li>Download to print or share digitally</li>
                <li>Share via WhatsApp for quick distribution</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Printing Tips</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Print at minimum 3x3 cm (1.2x1.2 inches) size</li>
                <li>Use high contrast (black on white) for best scanning</li>
                <li>Add your logo or instructions around the QR code</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Placement Ideas</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Table tents or stickers on tables</li>
                <li>At entrance or reception desk</li>
                <li>On business cards and marketing materials</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded text-blue-800">
            <p className="font-medium">Pro Tip:</p> 
            <p>Use different QR codes for different tables or sections to track customer engagement. Consider creating menu-specific QRs for special promotions or events.</p>
          </div>
        </div>
      )}
    </div>
  );
}