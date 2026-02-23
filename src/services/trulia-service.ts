'use server';

/**
 * @fileOverview Trulia5 API Service via RapidAPI.
 * Handles location hashing, search requests, and Firestore caching.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const RAPIDAPI_KEY = process.env.RAPIDAPI_TRULIA_KEY || process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_TRULIA_HOST || 'trulia5.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

const headers = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key': RAPIDAPI_KEY || '',
};

// ── QUOTA TRACKER ───────────────────────────────
async function trackApiCall(userId: string, api: 'trulia' | 'realtor') {
  const month = new Date().toISOString().slice(0, 7);
  const quotaRef = adminDb.collection('users').doc(userId).collection('rapidapi_quota').doc(month);
  await quotaRef.set({ 
    [`${api}_calls`]: admin.firestore.FieldValue.increment(1), 
    month,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

// ── LOCATION HASH GENERATOR ─────────────────────
export async function generateLocationHash(params: {
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  regionId: string;
  locationId: string;
  subtype?: string;
}): Promise<string> {
  const locationObj = {
    type: "address",
    subtype: params.subtype || "city",
    name: params.name,
    city: params.city,
    state: params.state,
    lat: params.lat,
    lon: params.lon,
    regionId: params.regionId,
    locationId: params.locationId,
  };
  return Buffer.from(JSON.stringify(locationObj)).toString('base64');
}

// ── TRULIA API WRAPPER WITH CACHING ──────────────
async function cachedPost(
  userId: string,
  endpoint: string,
  body: object,
  cacheTTL_hours: number = 6
): Promise<any> {
  if (!userId) throw new Error("User ID required for Trulia service");
  if (!RAPIDAPI_KEY) throw new Error("RapidAPI key not configured for Trulia");

  const bodyStr = JSON.stringify(body);
  const cacheKey = Buffer.from(`${endpoint}_${bodyStr}`).toString('base64').slice(0, 100).replace(/\//g, '_');
  const cacheRef = adminDb.collection('users').doc(userId).collection('trulia_cache').doc(cacheKey);

  try {
    const cached = await cacheRef.get();
    if (cached.exists) {
      const data = cached.data();
      const expiresAt = data?.expires_at?.toDate();
      if (expiresAt && expiresAt > new Date()) {
        console.log(`[Trulia] Cache hit: ${endpoint}`);
        return data?.response;
      }
    }

    console.log(`[Trulia] API call: ${endpoint}`);
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers,
      body: bodyStr,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Trulia API error ${response.status}: ${errText}`);
    }

    const result = await response.json();

    // Track quota
    await trackApiCall(userId, 'trulia');

    // Update cache
    await cacheRef.set({
      endpoint,
      body,
      response: result,
      cached_at: admin.firestore.FieldValue.serverTimestamp(),
      expires_at: new Date(Date.now() + cacheTTL_hours * 60 * 60 * 1000),
    });

    return result;
  } catch (error) {
    console.error("Trulia Service Error:", error);
    throw error;
  }
}

// ── SEARCH ENDPOINTS ─────────────────────────────
export async function searchTrulia(userId: string, params: {
  encodedHash: string;
  listingType?: 'FOR_SALE' | 'SOLD';
  filters?: any;
}) {
  const endpoint = params.listingType === 'SOLD' ? 'api/listing/search-sold' : 'api/listing/search';
  return cachedPost(userId, endpoint, {
    encodedHash: params.encodedHash,
    sortBy: "newest",
    filters: params.filters || {},
  });
}

// ── NORMALIZE LISTING ────────────────────────────
export async function normalizeTruliaListing(raw: any) {
  return {
    id: raw.id || raw.listingId || Math.random().toString(36).substr(2, 9),
    address: raw.location?.formattedAddress || raw.address || 'Unknown Address',
    city: raw.location?.city || 'Las Vegas',
    list_price: raw.price?.amount || raw.listingPrice || 0,
    sold_price: raw.soldPrice?.amount || null,
    beds: raw.bedrooms || 0,
    baths: raw.bathrooms || 0,
    sqft: raw.floorSpace?.floorSpaceValue || 0,
    days_on_market: raw.daysOnMarket || 0,
    is_fsbo: raw.listingType === 'FSBO',
    is_foreclosure: raw.listingType === 'FORECLOSURE',
    price_reduced: raw.priceReduced || false,
    status: raw.status || 'FOR_SALE',
    sold_date: raw.soldDate || null,
    thumbnail: raw.media?.photos?.[0]?.url || null,
  };
}
