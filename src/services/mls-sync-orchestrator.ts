'use server';

/**
 * @fileOverview Orchestrates multi-source MLS syncing with fallback logic.
 * Tries Trulia -> Realtor -> Public Sources.
 */

import { searchTrulia, normalizeTruliaListing } from './trulia-service';
import { searchRealtor, normalizeRealtorListing } from './realtor-service';
import { MONICA_MARKET_HASHES } from '@/config/trulia-constants';

export interface SyncResult {
  data: any[];
  source: 'trulia' | 'realtor' | 'zillow' | 'homes' | 'fallback';
  status: 'success' | 'partial' | 'fallback';
}

export async function unifiedMLSSync(userId: string, marketKey: string, activeTab: string): Promise<SyncResult> {
  const hash = (MONICA_MARKET_HASHES as any)[marketKey];
  
  // Market mapping for Realtor API (since it doesn't use hashes)
  const marketMap: Record<string, { city: string; state: string }> = {
    las_vegas: { city: 'Las Vegas', state: 'NV' },
    henderson: { city: 'Henderson', state: 'NV' },
    north_las_vegas: { city: 'North Las Vegas', state: 'NV' },
    summerlin: { city: 'Las Vegas', state: 'NV' }
  };

  const marketInfo = marketMap[marketKey] || marketMap.las_vegas;

  // ── TRY TRULIA (Primary) ───────────────────────
  try {
    console.log(`[MLS Orchestrator] Attempting Trulia sync for ${marketKey}...`);
    let filters = {};
    let listingType: 'FOR_SALE' | 'SOLD' = 'FOR_SALE';

    if (activeTab === "fsbo") filters = { listingTypes: ["FSBO"] };
    if (activeTab === "foreclosure") filters = { listingTypes: ["FORECLOSURE"] };
    if (activeTab === "reduced") filters = { priceReduced: true };
    if (activeTab === "sold") listingType = 'SOLD';

    const res = await searchTrulia(userId, { encodedHash: hash, listingType, filters });
    
    if (res?.data && res.data.length > 0) {
      const normalized = await Promise.all(res.data.map((raw: any) => normalizeTruliaListing(raw)));
      return { data: normalized, source: 'trulia', status: 'success' };
    }
    
    throw new Error("Trulia returned empty results");
  } catch (error) {
    console.warn(`[MLS Orchestrator] Trulia failed: ${error instanceof Error ? error.message : 'Unknown error'}. Falling back to Realtor.com...`);
  }

  // ── TRY REALTOR.COM (Secondary) ─────────────────
  try {
    console.log(`[MLS Orchestrator] Attempting Realtor.com sync for ${marketInfo.city}...`);
    const res = await searchRealtor(userId, { 
      city: marketInfo.city, 
      state_code: marketInfo.state,
      limit: 40 
    });

    if (res?.properties && res.properties.length > 0) {
      const normalized = await Promise.all(res.properties.map((raw: any) => normalizeRealtorListing(raw)));
      return { data: normalized, source: 'realtor', status: 'fallback' };
    }
  } catch (error) {
    console.error(`[MLS Orchestrator] Realtor.com failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // ── FINAL FALLBACK (Stub for Zillow/Homes) ──────
  console.error(`[MLS Orchestrator] All real-time sync providers failed for ${marketKey}.`);
  return { 
    data: [], 
    source: 'fallback', 
    status: 'fallback' 
  };
}
