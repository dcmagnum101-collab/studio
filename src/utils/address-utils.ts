/**
 * Normalizes an address for fuzzy matching between GIS and MLS.
 * This is a synchronous utility function and should not be in a 'use server' file.
 */
export function normalizeAddress(addr: string): string {
  if (!addr) return '';
  return addr.toLowerCase()
    .replace(/\./g, '')
    .replace(/,.*$/, '') // remove city/state if present
    .replace(/\s+/g, ' ')
    .trim();
}
