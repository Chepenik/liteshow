// Proxies Jamendo API calls server-side. Client ID stays on server.
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'JAMENDO_CLIENT_ID not configured' }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  // Forward all params except client_id, which we inject server-side
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'client_id') params.set(key, value);
  });
  params.set('client_id', clientId);

  const url = `https://api.jamendo.com/v3.0/tracks/?${params}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'liteshow/2.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Jamendo API returned ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
