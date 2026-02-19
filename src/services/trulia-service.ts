
'use server';

/**
 * @fileOverview Trulia5 API Service via RapidAPI.
 * Handles location hashing, search requests, and Firestore caching.
 */

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

const RAPIDAPI_KEY = process.env.RAPIDAPI_TRULIA_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_TRULIA_HOST || 'trulia5.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

const headers = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key': RAPIDAPI_KEY!,
};

// ── QUOTA TRACKER ───────────────────────────────
async function trackApiCall(userId: string, api: 'trulia' | 'realtor') {
  const month = new Date().toISOString().slice(0, 7);
  const quotaRef = doc(db, 'users', userId, 'rapidapi_quota', month);
  await setDoc(quotaRef, { 
    [`${api}_calls`]: increment(1), 
    month,
    updated_at: serverTimestamp()
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

export const MONICA_MARKET_HASHES = {
  las_vegas: Buffer.from(JSON.stringify({
    type: "address", subtype: "city", name: "Las Vegas, NV", city: "Las Vegas", state: "NV",
    lat: 36.1699, lon: -115.1398, regionId: "11078", locationId: "11078"
  })).toString('base64'),
  henderson: Buffer.from(JSON.stringify({
    type: "address", subtype: "city", name: "Henderson, NV", city: "Henderson", state: "NV",
    lat: 36.0395, lon: -114.9817, regionId: "11079", locationId: "11079"
  })).toString('base64'),
};

// ── TRULIA API WRAPPER WITH CACHING ──────────────
async function cachedPost(
  userId: string,
  endpoint: string,
  body: object,
  cacheTTL_hours: number = 6
): Promise<any> {
  if (!userId) throw new Error("User ID required for Trulia service");

  const cacheKey = Buffer.from(`${endpoint}_${JSON.stringify(body)}`).toString('base64').slice(0, 100);
  const cacheRef = doc(db, 'users', userId, 'trulia_cache', cacheKey);

  try {
    const cached = await getDoc(cacheRef);
    if (cached.exists()) {
      const data = cached.data();
      const expiresAt = data.expires_at?.toDate();
      if (expiresAt && expiresAt > new Date()) {
        console.log(`Trulia cache hit: ${endpoint}`);
        return data.response;
      }
    }

    console.log(`Trulia API call: ${endpoint}`);
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Trulia API error ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();

    // Track quota
    await trackApiCall(userId, 'trulia');

    // Update cache
    await setDoc(cacheRef, {
      endpoint,
      body,
      response: result,
      cached_at: serverTimestamp(),
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
export function normalizeTruliaListing(raw: any) {
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
