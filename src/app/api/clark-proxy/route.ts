import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint') || 'Assessor/MapServer/0/query';
  
  const baseUrl = 'https://gisgate.co.clark.nv.us/arcgis/rest/services/';
  const url = new URL(baseUrl + endpoint);
  
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      url.searchParams.append(key, value);
    }
  });
  
  if (!url.searchParams.has('f')) {
    url.searchParams.append('f', 'json');
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clark County Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Clark County GIS' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint, params } = await request.json();
    
    const baseUrl = 'https://gisgate.co.clark.nv.us/arcgis/rest/services/';
    const url = new URL(baseUrl + (endpoint || 'Assessor/MapServer/0/query'));
    
    const body = new URLSearchParams({
      ...params,
      f: 'json'
    });

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clark County Proxy POST Error:', error);
    return NextResponse.json({ error: 'Failed to post to Clark County GIS' }, { status: 500 });
  }
}
