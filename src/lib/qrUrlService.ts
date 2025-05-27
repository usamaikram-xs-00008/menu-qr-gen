// lib/qrUrlService.ts
import { Database } from './database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Menu = Database['public']['Tables']['menus']['Row'];

/**
 * Generate a URL for a restaurant location
 * @param baseUrl - The base URL of the application (e.g., http://localhost:3000)
 * @param restaurantSlug - The slug of the restaurant
 * @param locationSlug - The slug of the location
 * @returns The full URL to the location
 */
export function generateLocationUrl(
  baseUrl: string,
  restaurantSlug: string,
  locationSlug: string
): string {
  return `${baseUrl}/menus/${restaurantSlug}/${locationSlug}`;
}

/**
 * Generate a URL for a specific menu at a restaurant location
 * @param baseUrl - The base URL of the application
 * @param restaurantSlug - The slug of the restaurant
 * @param locationSlug - The slug of the location
 * @param menuSlug - The slug of the menu
 * @returns The full URL to the specific menu at the location
 */
export function generateMenuUrl(
  baseUrl: string,
  restaurantSlug: string,
  locationSlug: string,
  menuSlug: string
): string {
  return `${baseUrl}/menus/${restaurantSlug}/${locationSlug}/${menuSlug}`;
}

/**
 * Get the base URL from window location (client-side only)
 * @returns The base URL of the application
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  }
  return '';
}

/**
 * Generate a QR code URL for a location or specific menu
 * @param restaurant - The restaurant object
 * @param location - The location object
 * @param menu - Optional menu object for menu-specific QR codes
 * @returns The URL to be encoded in the QR code
 */
export function generateQrCodeUrl(
  restaurant: Pick<Restaurant, 'slug'>,
  location: Pick<Location, 'slug'>,
  menu?: Pick<Menu, 'slug'> | null
): string {
  const baseUrl = getBaseUrl();
  
  if (menu && menu.slug) {
    return generateMenuUrl(baseUrl, restaurant.slug, location.slug, menu.slug);
  }
  
  return generateLocationUrl(baseUrl, restaurant.slug, location.slug);
}