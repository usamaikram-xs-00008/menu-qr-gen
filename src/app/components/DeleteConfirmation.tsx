'use client';

import { FiTrash2 } from 'react-icons/fi';

interface DeleteConfirmationProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function DeleteConfirmation({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteConfirmationProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center text-red-600 mb-4">
          <FiTrash2 size={24} className="mr-2" />
          <h3 className="text-lg font-medium">Confirm Deletion</h3>
        </div>
        
        <p className="mb-4">
          Are you sure you want to delete this {itemName}? This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}