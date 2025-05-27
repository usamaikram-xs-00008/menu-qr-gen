'use client';

import { useState } from 'react';
import { FiFilter } from 'react-icons/fi';

interface QRCodeFilterProps {
  menuOptions: Array<{ id: string, name: string }>;
  onFilterChange: (filters: QRCodeFilters) => void;
}

export interface QRCodeFilters {
  menuId: string | null;
  showActive: boolean;
  showInactive: boolean;
}

export default function QRCodeFilter({ menuOptions, onFilterChange }: QRCodeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<QRCodeFilters>({
    menuId: null,
    showActive: true,
    showInactive: true
  });
  
  const handleChange = (
    key: keyof QRCodeFilters,
    value: string | boolean | null
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const resetFilters = () => {
    const defaultFilters = {
      menuId: null,
      showActive: true,
      showInactive: true
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
      >
        <FiFilter className="mr-1" />
        <span>Filter QR Codes</span>
        {(filters.menuId !== null || !filters.showActive || !filters.showInactive) && (
          <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {/* Count active filters */}
            {(filters.menuId !== null ? 1 : 0) + 
             (!filters.showActive ? 1 : 0) + 
             (!filters.showInactive ? 1 : 0)}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="mt-2 bg-white border rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-medium">Filter Options</h5>
            <button 
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Reset
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Menu</label>
              <select
                value={filters.menuId || ''}
                onChange={(e) => handleChange('menuId', e.target.value || null)}
                className="w-full p-2 text-sm border rounded"
              >
                <option value="">All Menus</option>
                <option value="location">Location QRs Only</option>
                {menuOptions.map(menu => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <div className="space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showActive}
                    onChange={(e) => handleChange('showActive', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">Active</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showInactive}
                    onChange={(e) => handleChange('showInactive', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm">Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}