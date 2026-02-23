'use server';

/**
 * @fileOverview Realtor.com Stable API Service via RapidAPI.
 * Handles property search and normalization as a backup source.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const RAPIDAPI_KEY = process.env.RAPIDAPI_REALTOR_KEY || process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_REALTOR_HOST || 'realtor-stable.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

const headers = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': RAPIDAPI_HOST,
  'x-rapidapi-key': RAPIDAPI_KEY || '',
};

async function trackApiCall(userId: string) {
  const month = new Date().toISOString().slice(0, 7);
  const quotaRef = adminDb.collection('users').doc(userId).collection('rapidapi_quota').doc(month);
  await quotaRef.set({ 
    realtor_calls: admin.firestore.FieldValue.increment(1), 
    month,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function searchRealtor(userId: string, params: {
  city: string;
  state_code: string;
  limit?: number;
  offset?: number;
  sort?: 'relevance' | 'newest' | 'price_low' | 'price_high';
}) {
  if (!userId) throw new Error("User ID required for Realtor service");
  if (!RAPIDAPI_KEY) throw new Error("RapidAPI key not configured for Realtor.com");

  const endpoint = 'properties/v2/list-for-sale';
  const queryParams = new URLSearchParams({
    city: params.city,
    state_code: params.state_code,
    limit: (params.limit || 20).toString(),
    offset: (params.offset || 0).toString(),
    sort: params.sort || 'newest',
  });

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Realtor API error ${response.status}`);
    }

    const result = await response.json();
    await trackApiCall(userId);
    return result;
  } catch (error) {
    console.error("Realtor Service Error:", error);
    throw error;
  }
}

export async function normalizeRealtorListing(raw: any) {
  return {
    id: raw.property_id || Math.random().toString(36).substr(2, 9),
    address: raw.address?.line || 'Unknown Address',
    city: raw.address?.city || 'Las Vegas',
    list_price: raw.price || 0,
    sold_price: null,
    beds: raw.beds || 0,
    baths: raw.baths || 0,
    sqft: raw.building_size?.size || 0,
    days_on_market: raw.days_on_market || 0,
    is_fsbo: false,
    is_foreclosure: false,
    price_reduced: raw.price_reduced_amount > 0,
    status: raw.prop_status === 'for_sale' ? 'FOR_SALE' : 'OFF_MARKET',
    sold_date: null,
    thumbnail: raw.thumbnail || null,
    source: 'realtor.com'
  };
}
