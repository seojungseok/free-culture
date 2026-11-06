import { NextResponse, type NextRequest } from 'next/server';
import curated from './data/curated-events.json';
import { eventPublicationPaths, expiredEventForPath } from './lib/event-publication.mjs';

export function middleware(request: NextRequest) {
  let path = request.nextUrl.pathname;
  // Also cover any previously generated Next image URL for this poster.
  if (path === '/_next/image') {
    const image = request.nextUrl.searchParams.get('url');
    if (image) {
      try { path = new URL(image, request.nextUrl.origin).pathname; } catch { /* invalid image URLs are handled by Next */ }
    }
  }
  const event = expiredEventForPath(curated.events, path);
  if (event) {
    return new NextResponse('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>행사 안내가 종료되었습니다</title><body><main><h1>행사 안내가 종료되었습니다</h1><p>게시 기간이 끝나 이 행사 안내를 내렸습니다.</p><a href="/free">현재 무료행사 보기</a></main></body></html>', {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, follow' },
    });
  }
  const response = NextResponse.next();
  // Do not let a CDN retain a successful response beyond its publishing deadline.
  if (curated.events.some(event => event.expiresAt && eventPublicationPaths(event).includes(path))) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  }
  return response;
}

export const config = { matcher: ['/event/:path*', '/event-posters/:path*', '/festivals/:path*', '/kids/c/:path*', '/_next/image'] };
