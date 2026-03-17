/**
 * macOS-friendly link helpers.
 * Phone numbers open FaceTime/Phone on click.
 * Addresses open in Apple Maps.
 */

/**
 * Returns a tel: href for phone numbers — clicking opens FaceTime on Mac.
 */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `tel:${digits.startsWith('1') ? digits : '1' + digits}`;
}

/**
 * Returns an Apple Maps URL for an address.
 */
export function appleMapsHref(address: string, city?: string, state?: string): string {
  const fullAddress = [address, city, state].filter(Boolean).join(', ');
  return `https://maps.apple.com/?q=${encodeURIComponent(fullAddress)}`;
}
