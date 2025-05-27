'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/lib/database.types';
import QRCode from 'qrcode';
// import Image from 'next/image';
import { FiPlus } from 'react-icons/fi';
import QRCodeCard from './QRCodeCard';
import QRCodeFilter, { QRCodeFilters } from './QRCodeFilter';
import QRCodeHelp from './QRCodeHelp';
import DeleteConfirmation from './DeleteConfirmation';
import Toast, { ToastType } from './Toast';

// Define proper types based on your database schema
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

// Define a type for menu assignment
interface MenuAssignment {
  id: string;
  menu_id: string;
  is_active: boolean;
  menus: Menu;
}

// Define a type for the raw QR code data from the API
interface QRCodeApiResponse {
  id: string;
  location_id: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  url?: string;
  menu_id?: string;
  [key: string]: unknown; // Allow for additional properties
}

interface LocationQRManagerProps {
  restaurantId: string;
  isAdmin: boolean;
}

interface LocationWithMenusAndQR extends Location {
  assignedMenus: MenuAssignment[];
  qrCodes: QRCodeType[];
}

export default function LocationQRManager({ restaurantId }: LocationQRManagerProps) {
  const [locations, setLocations] = useState<LocationWithMenusAndQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  
  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ locationId: string, qrCodeId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<QRCodeFilters>({
    menuId: null,
    showActive: true,
    showInactive: true
  });
  
  // Helper function to generate menu URLs
  const getMenuUrl = (restaurantSlug: string, locationSlug?: string, menuSlug?: string) => {
    const base = window.location.origin;
    
    if (menuSlug && locationSlug) {
      return `${base}/menus/${restaurantSlug}/${locationSlug}/${menuSlug}`;
    } else if (locationSlug) {
      return `${base}/menus/${restaurantSlug}/${locationSlug}`;
    } else {
      return `${base}/menus/${restaurantSlug}`;
    }
  };
  
  // Show toast notification
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };
  
  // Check if a QR code exists for a specific location and menu
  const qrCodeExistsForMenu = (location: LocationWithMenusAndQR, menuId?: string): boolean => {
    // Ensure we're only checking QR codes for this specific location
    return location.qrCodes.some(qr => {
      // Make sure we're only checking QR codes for this location
      if (qr.location_id !== location.id) {
        return false;
      }
      
      // For default location QR (no menu)
      if (menuId === undefined && qr.menu_id === null) {
        return true;
      }
      
      // For specific menu QR
      if (menuId && qr.menu_id === menuId) {
        return true;
      }
      
      return false;
    });
  };
  
  // Filter function for QR codes
  const filterQRCodes = (qrCodes: QRCodeType[]): QRCodeType[] => {
    return qrCodes.filter(qr => {
      // Filter by menu
      if (filters.menuId === 'location' && qr.menu_id) {
        return false;
      } else if (filters.menuId && filters.menuId !== 'location' && qr.menu_id !== filters.menuId) {
        return false;
      }
      
      // Filter by status
      if (qr.is_active && !filters.showActive) {
        return false;
      }
      if (!qr.is_active && !filters.showInactive) {
        return false;
      }
      
      return true;
    });
  };

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      
      // Fetch locations
      const locationsResponse = await fetch(`/api/restaurants/${restaurantId}/locations`);
      if (!locationsResponse.ok) throw new Error('Failed to fetch locations');
      const locationsData = await locationsResponse.json();
      
      // Fetch location details with menus and QR codes
      const locationsWithData: LocationWithMenusAndQR[] = await Promise.all(
        locationsData.map(async (location: Location) => {
          try {
            // Fetch assigned menus
            const menuResponse = await fetch(`/api/locations/${location.id}/menus`);
            const assignedMenus = menuResponse.ok ? await menuResponse.json() : [];
            
            // Fetch QR codes
            const qrResponse = await fetch(`/api/locations/${location.id}/qrcodes`);
            const qrCodesData = qrResponse.ok ? await qrResponse.json() : [];
            
            // Ensure proper typing for QR codes
            const qrCodes: QRCodeType[] = qrCodesData.map((qr: QRCodeApiResponse) => ({
              id: qr.id,
              location_id: qr.location_id,
              image_url: qr.image_url,
              is_active: qr.is_active,
              created_at: qr.created_at,
              updated_at: qr.updated_at,
              url: qr.url,
              menu_id: qr.menu_id
            }));
            
            return {
              ...location,
              assignedMenus: assignedMenus || [],
              qrCodes: qrCodes
            };
          } catch (err) {
            console.error(`Error fetching data for location ${location.id}:`, err);
            return {
              ...location,
              assignedMenus: [],
              qrCodes: []
            };
          }
        })
      );
      
      setLocations(locationsWithData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateQRCode = async (location: LocationWithMenusAndQR, menu?: Menu) => {
    try {
      // Check if QR code already exists for this menu/location
      const menuId = menu?.id;
      
      if (qrCodeExistsForMenu(location, menuId)) {
        showToast(`QR code for ${menu ? menu.name : 'this location'} already exists`, 'info');
        return;
      }
      
      setGeneratingQR(`${location.id}-${menu?.id || 'default'}`);
      
      // Get restaurant info for URL generation
      const restaurantResponse = await fetch(`/api/restaurants/${restaurantId}`);
      if (!restaurantResponse.ok) throw new Error('Failed to get restaurant info');
      const restaurant = await restaurantResponse.json();
      
      // Construct URL using the getMenuUrl helper
      const menuUrl = getMenuUrl(
        restaurant.slug, 
        location.slug, 
        menu?.slug
      );
      
      // Generate QR code as data URL first (since we're in browser environment)
      const qrDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Create a unique file name for the QR code
      const fileName = `qr-${restaurant.slug}-${location.slug}${menu?.slug ? `-${menu.slug}` : ''}-${Date.now()}.png`;
      const filePath = `qrcodes/${fileName}`;
      
      // Extract base64 data from data URL (format: data:image/png;base64,BASE64_DATA)
      const base64Data = qrDataUrl.split(',')[1];
      
      // Upload to Supabase Storage via API
      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: 'restaurant-images',
          path: filePath,
          base64Data: base64Data,
          contentType: 'image/png',
        }),
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload QR code image');
      }
      
      const { url } = await uploadResponse.json();
      
      // Save QR code to database with the Supabase storage URL and the menu URL
      const response = await fetch(`/api/locations/${location.id}/qrcodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: url, // Using the URL from Supabase storage now
          is_active: true,
          menu_id: menu?.id || null,
          url: menuUrl // Store the actual menu URL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save QR code');
      }

      // Show success toast
      showToast(`QR code for ${menu ? menu.name : 'location'} created successfully`, 'success');
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error generating QR code:', err);
      showToast('Failed to generate QR code', 'error');
    } finally {
      setGeneratingQR(null);
    }
  };

  const toggleQRCodeStatus = async (qrCodeId: string, newStatus: boolean): Promise<void> => {
    try {
      const locationId = locations.find(loc => 
        loc.qrCodes.some(qr => qr.id === qrCodeId)
      )?.id;
      
      if (!locationId) throw new Error('Location not found for this QR code');
      
      const response = await fetch(`/api/locations/${locationId}/qrcodes/${qrCodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update QR code status');
      }

      // Update local state
      setLocations(prevLocations => 
        prevLocations.map(location => ({
          ...location,
          qrCodes: location.qrCodes.map(qrCode => 
            qrCode.id === qrCodeId 
              ? { ...qrCode, is_active: newStatus } 
              : qrCode
          ),
        }))
      );
      
      // Show success toast
      showToast(
        `QR code ${newStatus ? 'activated' : 'deactivated'} successfully`, 
        'success'
      );
    } catch (err) {
      console.error('Error toggling QR code status:', err);
      showToast('Failed to update QR code status', 'error');
      throw err;
    }
  };

  const handleDeleteClick = (locationId: string, qrCodeId: string) => {
    setDeleteItem({ locationId, qrCodeId });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteItem) return;
    
    setIsDeleting(true);
    try {
      await deleteQRCode(deleteItem.locationId, deleteItem.qrCodeId);
      // UI update is handled in the deleteQRCode function
      showToast('QR code deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting QR code:', err);
      showToast('Failed to delete QR code', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteItem(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteItem(null);
  };

  const deleteQRCode = async (locationId: string, qrCodeId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/locations/${locationId}/qrcodes/${qrCodeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete QR code');
      }

      // Update local state to remove the deleted QR code
      setLocations(prevLocations => 
        prevLocations.map(location => {
          if (location.id === locationId) {
            return {
              ...location,
              qrCodes: location.qrCodes.filter(qr => qr.id !== qrCodeId)
            };
          }
          return location;
        })
      );
    } catch (err) {
      console.error('Error deleting QR code:', err);
      throw err;
    }
  };

  const downloadQRCode = (qrCode: QRCodeType, locationName: string) => {
    try {
      const link = document.createElement('a');
      link.href = qrCode.image_url;
      link.download = `${locationName.replace(/\s+/g, '-')}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('QR code downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showToast('Failed to download QR code', 'error');
    }
  };

  const shareViaWhatsApp = async (qrCode: QRCodeType, location: LocationWithMenusAndQR) => {
    try {
      // If the URL is already stored in the QR code object and valid, use it directly
      if (qrCode.url && qrCode.url.includes('/menus/')) {
        const message = `Check out our menu: ${qrCode.url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        showToast('Menu link shared via WhatsApp', 'success');
        return;
      }
      
      // Otherwise, regenerate the URL
      const restaurantResponse = await fetch(`/api/restaurants/${restaurantId}`);
      if (!restaurantResponse.ok) throw new Error('Failed to get restaurant info');
      const restaurant = await restaurantResponse.json();
      
      // Find menu slug if this QR code is associated with a menu
      let menuSlug: string | undefined;
      if (qrCode.menu_id) {
        const menuAssignment = location.assignedMenus.find((am: MenuAssignment) => am.menu_id === qrCode.menu_id);
        if (menuAssignment) {
          menuSlug = menuAssignment.menus.slug;
        }
      }
      
      // Generate the proper menu URL
      const menuUrl = getMenuUrl(restaurant.slug, location.slug, menuSlug);
      
      // Share via WhatsApp
      const message = `Check out our menu: ${menuUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      showToast('Menu link shared via WhatsApp', 'success');
    } catch (error) {
      console.error('Error sharing menu link:', error);
      showToast('Failed to share menu link', 'error');
    }
  };

  if (loading) return <div className="p-4">Loading QR code management...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Help Section */}
      <QRCodeHelp />
      
      {locations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No locations found.</p>
          <p className="text-sm text-gray-400">
            Create locations first to generate QR codes for them.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {locations.map((location, index) => {
            // Check if this location has any QR codes that can be generated
            const hasDefaultQR = qrCodeExistsForMenu(location);
            const pendingMenus = location.assignedMenus.filter((am: MenuAssignment) => 
              am.is_active && !qrCodeExistsForMenu(location, am.menus.id)
            );
            const hasQRsToGenerate = !hasDefaultQR || pendingMenus.length > 0;
            
            return (
              <div key={index} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{location.name}</h3>
                    {location.address && (
                      <p className="text-sm text-gray-600">{location.address}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    location.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {location.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Generate QR Codes Section */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Generate QR Codes:</h4>
                    
                    {/* Only show generation section if there are QR codes that can be generated */}
                    {hasQRsToGenerate ? (
                      <div className="flex gap-2 flex-wrap">
                        {/* Default location QR code button - only show if no default QR exists */}
                        {!hasDefaultQR && (
                          <button
                            onClick={() => generateQRCode(location)}
                            disabled={generatingQR === `${location.id}-default`}
                            className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            <FiPlus className="mr-1" />
                            {generatingQR === `${location.id}-default` ? 'Generating...' : 'Default Menu QR'}
                          </button>
                        )}
                        
                        {/* Menu-specific QR code buttons - only show for menus without QR codes */}
                        {pendingMenus.map((assignment: MenuAssignment, index) => (
                          <button
                            key={index}
                            onClick={() => generateQRCode(location, assignment.menus)}
                            disabled={generatingQR === `${location.id}-${assignment.menu_id}`}
                            className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            <FiPlus className="mr-1" />
                            {generatingQR === `${location.id}-${assignment.menu_id}` 
                              ? 'Generating...' 
                              : `${assignment.menus?.name || 'Menu'} QR`
                            }
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">All QR codes have been generated for this location.</p>
                    )}
                  </div>

                  {/* Existing QR Codes Section */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-800">Existing QR Codes:</h4>
                      
                      {/* Add filter component if there are QR codes */}
                      {location.qrCodes.length > 0 && (
                        <QRCodeFilter 
                          menuOptions={location.assignedMenus
                            .filter((am: MenuAssignment) => am.is_active)
                            .map((am: MenuAssignment) => ({ 
                              id: am.menu_id, 
                              name: am.menus.name 
                            }))
                          }
                          onFilterChange={setFilters}
                        />
                      )}
                    </div>
                    
                    {location.qrCodes.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No QR codes generated yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterQRCodes(location.qrCodes).map((qrCode) => (
                          <QRCodeCard
                            key={qrCode.id}
                            qrCode={qrCode}
                            location={location}
                            menuAssignments={location.assignedMenus}
                            onDownload={() => downloadQRCode(qrCode, location.name)}
                            onShare={() => shareViaWhatsApp(qrCode, location)}
                            onDelete={() => handleDeleteClick(location.id, qrCode.id)}
                            onToggle={(newStatus) => toggleQRCodeStatus(qrCode.id, newStatus)}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Show message when no QR codes match the filter */}
                    {location.qrCodes.length > 0 && filterQRCodes(location.qrCodes).length === 0 && (
                      <div key={`no-matches-${location.id}`} className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No QR codes match the current filters.</p>
                        <button
                          onClick={() => setFilters({menuId: null, showActive: true, showInactive: true})}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Reset Filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        itemName="QR code"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={isDeleting}
      />
      
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}