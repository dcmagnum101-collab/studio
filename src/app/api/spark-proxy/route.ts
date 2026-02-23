import { NextRequest, NextResponse } from 'next/server';
import { getListingsInRadius, getListingByAddress, getListingDetail } from '@/services/lvr-mls-service';

/**
 * Server-side proxy for Spark API to keep keys secure.
 */
export async function POST(req: NextRequest) {
  try {
    const { action, params } = await req.json();

    if (!process.env.SPARK_API_KEY) {
      return NextResponse.json({ error: 'SPARK_API_KEY not configured on server' }, { status: 500 });
    }

    let result;

    switch (action) {
      case 'listings_in_radius':
        result = await getListingsInRadius(params.userId, params.lat, params.lng, params.radius);
        break;
      case 'listing_by_address':
        result = await getListingByAddress(params.address);
        break;
      case 'listing_detail':
        result = await getListingDetail(params.listingKey);
        break;
      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Spark Proxy] Critical failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
