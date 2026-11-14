import {readDataFreshness} from '@/lib/data-freshness.mjs';
export const dynamic='force-dynamic';
export function GET() {
  return Response.json(readDataFreshness(), {headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
}
