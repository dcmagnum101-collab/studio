'use server';

/**
 * @fileOverview Intelligent CMA (Comparative Market Analysis) Action.
 * Fetches comps via RapidAPI and synthesizes pricing strategy with Grok.
 */

import { adminDb } from '@/lib/firebase-admin';
import { grokJSON } from '@/services/grok-service';
import { searchTrulia, normalizeTruliaListing } from '@/services/trulia-service';
import { MONICA_MARKET_HASHES } from '@/config/trulia-constants';

export interface CMAComp {
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  soldPrice: number;
  soldDate: string;
  daysOnMarket: number;
  pricePerSqFt: number;
}

export interface CMAReport {
  subject: any;
  comparables: CMAComp[];
  analysis: {
    recommendedPrice: number;
    priceRange: { low: number; target: number; high: number };
    narrative: string;
    marketInsight: string;
  };
  generatedAt: string;
}

export async function generateCMAReport(userId: string, contactId: string): Promise<CMAReport> {
  if (!userId || !contactId) throw new Error('Parameters required');

  // 1. Fetch Subject Property
  const contactSnap = await adminDb.collection('users').doc(userId).collection('contacts').doc(contactId).get();
  if (!contactSnap.exists) throw new Error('Contact not found');
  const subject = contactSnap.data()!;

  // 2. Fetch Comps (Sold Listings)
  const hash = MONICA_MARKET_HASHES.las_vegas;
  const truliaRes = await searchTrulia(userId, { 
    encodedHash: hash, 
    listingType: 'SOLD',
    filters: { 
      zipCode: subject.zip || subject.propertyAddress.slice(-5),
      bedrooms: { min: (subject.beds || 3) - 1, max: (subject.beds || 3) + 1 },
      bathrooms: { min: (subject.baths || 2) - 1 }
    }
  });

  const rawComps = (truliaRes?.data || []).slice(0, 5);
  const normalizedComps: CMAComp[] = rawComps.map((c: any) => ({
    address: c.location?.formattedAddress || 'Comp Address',
    beds: c.bedrooms || 0,
    baths: c.bathrooms || 0,
    sqft: c.floorSpace?.floorSpaceValue || 0,
    soldPrice: c.soldPrice?.amount || c.price?.amount || 0,
    soldDate: c.soldDate || new Date().toISOString(),
    daysOnMarket: c.daysOnMarket || 30,
    pricePerSqFt: (c.soldPrice?.amount || 0) / (c.floorSpace?.floorSpaceValue || 1)
  }));

  // 3. AI Analysis with Grok
  const system = `You are Monica Selvaggio's executive pricing analyst. 
  Perform a Comparative Market Analysis (CMA). Analyze the subject property against the comps.
  Recommend a strategic listing price.
  
  Return ONLY valid JSON:
  {
    "recommendedPrice": number,
    "priceRange": { "low": number, "target": number, "high": number },
    "narrative": string,
    "marketInsight": string
  }`;

  const userPrompt = `
  SUBJECT PROPERTY:
  Address: ${subject.propertyAddress}
  Beds/Baths: ${subject.beds}/${subject.baths}
  SqFt: ${subject.sqft}
  
  COMPARABLE SOLD DATA:
  ${JSON.stringify(normalizedComps)}
  
  Market: Las Vegas/Henderson
  Note: Nevada is a non-disclosure state. Frame the narrative as a "Strategic Valuation" based on neighborhood benchmarks.
  `;

  try {
    const analysis = await grokJSON<CMAReport['analysis']>(system, userPrompt, userId);
    
    return {
      subject,
      comparables: normalizedComps,
      analysis,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[CMA Action] Synthesis failed:', error);
    throw new Error('Monica could not finalize the market analysis. Please verify API configuration.');
  }
}
