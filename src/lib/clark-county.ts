import { HIGH_MOBILITY_ZIPS } from "./census";

export interface ClarkParcel {
  APN: string;
  OWNER_NAME: string;
  OWNER_ADDR: string;
  OWNER_CITY: string;
  OWNER_STATE: string;
  OWNER_ZIP: string;
  SITUS_ADDR: string;
  SITUS_CITY: string;
  SITUS_ZIP: string;
  LAND_USE: string;
  TOTAL_AV: number;
  LAND_AV: number;
  IMPR_AV: number;
  ACREAGE: number;
  SQFT: number;
  YEAR_BUILT: number;
  BEDROOMS: number;
  BATHROOMS: number;
  SALE_PRICE: number;
  SALE_DATE: string;
  geometry?: {
    x: number;
    y: number;
  };
}

export const calculateICPScore = (parcel: Partial<ClarkParcel>) => {
  let score = 45; // Base
  
  // Out of state
  if (parcel.OWNER_STATE && parcel.OWNER_STATE !== 'NV') {
    score += 12;
  }
  
  // 10+ years ownership
  if (parcel.SALE_DATE) {
    const saleYear = new Date(parcel.SALE_DATE).getFullYear();
    const currentYear = new Date().getFullYear();
    if (currentYear - saleYear >= 10) {
      score += 12;
    }
  }
  
  // High equity (TOTAL_AV vs SALE_PRICE appreciation)
  if (parcel.TOTAL_AV && parcel.SALE_PRICE && parcel.SALE_PRICE > 0) {
    const appreciation = (parcel.TOTAL_AV - parcel.SALE_PRICE) / parcel.SALE_PRICE;
    if (appreciation > 0.5) {
      score += 15;
    }
  }

  // Census Mobility Bonus
  if (parcel.SITUS_ZIP && HIGH_MOBILITY_ZIPS.includes(parcel.SITUS_ZIP)) {
    score += 6;
  }
  
  // Residential land use
  if (parcel.LAND_USE === '10' || parcel.LAND_USE === '11') {
    score += 5;
  }

  return Math.min(99, score);
};

export const fetchParcelAtPoint = async (lat: number, lng: number) => {
  const params = {
    geometry: JSON.stringify({ x: lng, y: lat }),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    f: 'json'
  };

  const res = await fetch(`/api/clark-proxy?${new URLSearchParams(params).toString()}`);
  const data = await res.json();
  return data.features?.[0];
};

export const fetchAssessorDetail = async (apn: string) => {
  const params = {
    where: `APN = '${apn}'`,
    outFields: '*',
    f: 'json'
  };
  const res = await fetch(`/api/clark-proxy?${new URLSearchParams(params).toString()}`);
  const data = await res.json();
  return data.features?.[0]?.attributes;
};

export const searchProperties = async (query: string) => {
  if (!query || query.length < 3) return [];
  
  const params = {
    where: `SITUS_ADDR LIKE '%${query.toUpperCase()}%' OR OWNER_NAME LIKE '%${query.toUpperCase()}%' OR APN LIKE '%${query}%'`,
    outFields: 'APN,SITUS_ADDR,OWNER_NAME,TOTAL_AV',
    resultRecordCount: '10',
    f: 'json'
  };

  const res = await fetch(`/api/clark-proxy?${new URLSearchParams(params).toString()}`);
  const data = await res.json();
  return data.features || [];
};

export const pullZoneParcels = async (geometry: any, geometryType: string = 'esriGeometryPolygon') => {
  const params = {
    geometry: JSON.stringify(geometry),
    geometryType,
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'APN,OWNER_NAME,OWNER_ADDR,OWNER_CITY,OWNER_STATE,OWNER_ZIP,SITUS_ADDR,SITUS_CITY,SITUS_ZIP,TOTAL_AV,SALE_PRICE,SALE_DATE,LAND_USE,SQFT,BEDROOMS,BATHROOMS,YEAR_BUILT',
    where: "LAND_USE IN ('10', '11')",
    resultRecordCount: '500',
    returnGeometry: 'true',
    f: 'json'
  };

  const res = await fetch('/api/clark-proxy', {
    method: 'POST',
    body: JSON.stringify({ endpoint: 'Assessor/MapServer/0/query', params })
  });
  
  const data = await res.json();
  return (data.features || []).map((f: any) => ({
    ...f.attributes,
    lat: f.geometry.y,
    lng: f.geometry.x,
    geometry: f.geometry
  }));
};
