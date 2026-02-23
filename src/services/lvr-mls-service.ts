'use server';

/**
 * @fileOverview LVR (Las Vegas Realtors) Spark API Service.
 * Handles OpenID Connect authenticated queries to the Spark platform.
 */

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { normalizeAddress } from '@/utils/address-utils';

const SPARK_API_URL = 'https://sparkapi.com/v1';
const SPARK_API_KEY = process.env.SPARK_API_KEY;

export interface MLSListing {
  listingKey: string;
  standardStatus: string;
  listPrice: number;
  listAgentName: string;
  listOfficeName: string;
  closePrice?: number;
  closeDate?: string;
  address: string;
  city: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  lat: number;
  lng: number;
  daysOnMarket: number;
  pendingDate?: string;
  pinColor: string;
  pinLabel: 'Listed' | 'Pending' | 'FSBO' | 'FRBO' | 'Available';
}

/**
 * Maps Spark Status to Monica's Tactical Map Logic
 */
function getPinAttributes(raw: any): { color: string; label: MLSListing['pinLabel'] } {
  const status = raw.StandardStatus;
  const office = raw.ListOfficeName?.toLowerCase() || '';
  const agentKey = raw.ListAgentKey;

  // FSBO Detection
  if (status === 'Active' && (office.includes('by owner') || !raw.ListOfficeName)) {
    return { color: '#2563EB', label: 'FSBO' };
  }

  // Pending / Under Contract
  if (status === 'Pending' || status === 'Active Under Contract') {
    return { color: '#EAB308', label: 'Pending' };
  }

  // Active with another agent
  if (status === 'Active' && agentKey) {
    return { color: '#DC2626', label: 'Listed' };
  }

  // General Available
  if (status === 'Active') {
    return { color: '#16A34A', label: 'Available' };
  }

  return { color: '#6B7280', label: 'Available' };
}

/**
 * Fetch from Spark API with Auth
 */
async function fetchSpark(endpoint: string, params: Record<string, string> = {}) {
  if (!SPARK_API_KEY) {
    console.warn('[Spark Service] SPARK_API_KEY not configured.');
    return { results: [] };
  }

  const queryParams = new URLSearchParams(params).toString();
  const url = `${SPARK_API_URL}${endpoint}${queryParams ? `?${queryParams}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SPARK_API_KEY}`,
        'X-SparkApi-User-Agent': 'MonicaAIHub/1.0',
        'Accept': 'application/json'
      },
      next: { revalidate: 900 } // 15 min cache
    });

    if (response.status === 401) throw new Error('Spark API key invalid or expired');
    if (response.status === 429) throw new Error('Spark API rate limit hit');
    if (!response.ok) throw new Error(`Spark API Error: ${response.status}`);

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Spark Service] Fetch failed:', error);
    throw error;
  }
}

export async function getListingsInRadius(userId: string, lat: number, lng: number, radiusMeters: number): Promise<MLSListing[]> {
  const radiusMiles = radiusMeters * 0.000621371;
  const cacheKey = `radius_${lat.toFixed(4)}_${lng.toFixed(4)}_${radiusMeters}`;
  const cacheRef = adminDb.collection('users').doc(userId).collection('mls_cache').doc(cacheKey);

  // Check Firestore Cache (15 min)
  const cached = await cacheRef.get();
  if (cached.exists) {
    const data = cached.data();
    if (data?.expires_at.toDate() > new Date()) {
      return data.listings;
    }
  }

  const params = {
    '_filter': `Nearby(${lat},${lng},${radiusMiles})`,
    '_select': 'ListingKey,StandardStatus,ListPrice,ListAgentKey,ListAgentFullName,ListOfficeName,ClosePrice,CloseDate,StreetNumber,StreetName,City,StateOrProvince,PostalCode,BedroomsTotal,BathroomsTotal,LivingArea,YearBuilt,Latitude,Longitude,ModificationTimestamp,BuyerAgentKey,PendingTimestamp,ListingContractDate,DaysOnMarket',
    '_limit': '200'
  };

  const response = await fetchSpark('/listings', params);
  const rawListings = response.results || [];

  const listings: MLSListing[] = rawListings.map((raw: any) => {
    const attrs = getPinAttributes(raw);
    return {
      listingKey: raw.ListingKey,
      standardStatus: raw.StandardStatus,
      listPrice: raw.ListPrice,
      listAgentName: raw.ListAgentFullName,
      listOfficeName: raw.ListOfficeName,
      closePrice: raw.ClosePrice,
      closeDate: raw.CloseDate,
      address: `${raw.StreetNumber} ${raw.StreetName}`,
      city: raw.City,
      zip: raw.PostalCode,
      beds: raw.BedroomsTotal,
      baths: raw.BathroomsTotal,
      sqft: raw.LivingArea,
      yearBuilt: raw.YearBuilt,
      lat: raw.Latitude,
      lng: raw.Longitude,
      daysOnMarket: raw.DaysOnMarket,
      pendingDate: raw.PendingTimestamp,
      pinColor: attrs.color,
      pinLabel: attrs.label
    };
  });

  // Persist to Cache
  await cacheRef.set({
    listings,
    expires_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000))
  });

  return listings;
}

export async function getListingByAddress(address: string): Promise<MLSListing | null> {
  const params = {
    '_filter': `StreetAddress Eq '${address}'`,
    '_select': 'ListingKey,StandardStatus,ListPrice,ListAgentKey,ListAgentFullName,ListOfficeName,ClosePrice,CloseDate,StreetNumber,StreetName,City,PostalCode,BedroomsTotal,BathroomsTotal,LivingArea,YearBuilt,Latitude,Longitude,DaysOnMarket',
    '_limit': '1'
  };

  const response = await fetchSpark('/listings', params);
  if (!response.results?.[0]) return null;

  const raw = response.results[0];
  const attrs = getPinAttributes(raw);

  return {
    listingKey: raw.ListingKey,
    standardStatus: raw.StandardStatus,
    listPrice: raw.ListPrice,
    listAgentName: raw.ListAgentFullName,
    listOfficeName: raw.ListOfficeName,
    address: `${raw.StreetNumber} ${raw.StreetName}`,
    city: raw.City,
    zip: raw.PostalCode,
    beds: raw.BedroomsTotal,
    baths: raw.BathroomsTotal,
    sqft: raw.LivingArea,
    yearBuilt: raw.YearBuilt,
    lat: raw.Latitude,
    lng: raw.Longitude,
    daysOnMarket: raw.DaysOnMarket,
    pinColor: attrs.color,
    pinLabel: attrs.label
  };
}

export async function getListingDetail(listingKey: string): Promise<any> {
  const response = await fetchSpark(`/listings/${listingKey}`);
  return response.results?.[0] || null;
}

/**
 * Returns market vitals for a zip code (mocked using spark logic).
 */
export async function getMarketVitals(userId: string, zip: string) {
  // In a real scenario, this would aggregate recent closed/active data
  return {
    zipCode: zip,
    median_price: 450000 + (Math.random() * 50000),
    avg_dom: 35 + Math.floor(Math.random() * 10)
  };
}

export async function queryLVRListings(params: { status: string[], zipCodes: string[], filter?: string }) {
  // Spark implementation
  const statusFilter = params.status.length ? `StandardStatus In (${params.status.map(s => `'${s}'`).join(',')})` : '';
  const zipFilter = params.zipCodes.length ? `PostalCode In (${params.zipCodes.map(z => `'${z}'`).join(',')})` : '';
  
  const combined = [statusFilter, zipFilter, params.filter].filter(Boolean).join(' And ');
  
  const response = await fetchSpark('/listings', {
    '_filter': combined,
    '_limit': '50'
  });
  
  return response.results || [];
}

export async function normalizeLVRProperty(raw: any, source: string) {
  const attrs = getPinAttributes(raw);
  return {
    mlsNumber: raw.ListingKey,
    propertyAddress: `${raw.StreetNumber} ${raw.StreetName}`,
    city: raw.City,
    state: raw.StateOrProvince,
    zip: raw.PostalCode,
    listPrice: raw.ListPrice,
    beds: raw.BedroomsTotal,
    baths: raw.BathroomsTotal,
    sqft: raw.LivingArea,
    yearBuilt: raw.YearBuilt,
    listing_status: raw.StandardStatus,
    archagent_source: source,
    icpScore: raw.StandardStatus === 'Expired' ? 85 : 45
  };
}
