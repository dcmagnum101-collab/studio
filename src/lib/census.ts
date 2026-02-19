/**
 * @fileOverview US Census Bureau API Integration
 * Fetches demographic and mobility signals for Las Vegas zip codes.
 */

export interface MobilityData {
  zipCode: string;
  mobilityScore: number;
  medianYearBuilt: number;
  medianRent: number;
  commuteStressIndex: number;
}

const CENSUS_API_BASE = 'https://api.census.gov/data/2023/acs/acs5';

/**
 * Fetches mobility and housing data for a specific zip code.
 * Variables:
 * B25035_001E: Median Year Structure Built
 * B25064_001E: Median Gross Rent
 * B08303_001E: Travel Time to Work (Commute Stress)
 */
export async function fetchZipMobilityData(zipCode: string): Promise<MobilityData | null> {
  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `${CENSUS_API_BASE}?get=B25035_001E,B25064_001E,B08303_001E&for=zip+code+tabulation+area:${zipCode}&in=state:32&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data || data.length < 2) return null;

    const [headers, values] = data;
    const yearBuilt = parseInt(values[0]);
    const rent = parseInt(values[1]);
    const commute = parseInt(values[2]);

    // Calculate mobility score (0-100)
    // Factors: Older homes (pre-1995), higher rent, longer commutes
    let mobilityScore = 50;
    if (yearBuilt < 1995) mobilityScore += 15;
    if (rent > 1500) mobilityScore += 10;
    if (commute > 30) mobilityScore += 10;

    return {
      zipCode,
      mobilityScore: Math.min(99, mobilityScore),
      medianYearBuilt: yearBuilt,
      medianRent: rent,
      commuteStressIndex: commute
    };
  } catch (error) {
    console.error(`Census API error for zip ${zipCode}:`, error);
    return null;
  }
}

/**
 * Known High Mobility Zip Codes in Clark County (Cache for ICP scoring)
 */
export const HIGH_MOBILITY_ZIPS = [
  '89101', '89104', '89106', '89109', '89119', '89121', '89169'
];
