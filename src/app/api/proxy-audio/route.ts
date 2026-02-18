// Proxies audio file fetches to *.jamendo.com. Validates domain server-side.
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('jamendo.com')) {
    return NextResponse.json({ error: 'Forbidden: only jamendo.com URLs allowed' }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'liteshow/2.0' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return new NextResponse(`Audio fetch failed (${res.status})`, { status: res.status });
    }

    const contentType = res.headers.get('Content-Type') || 'audio/mpeg';
    const body = res.body;

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    return new NextResponse(String(e), { status: 502 });
  }
}
