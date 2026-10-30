import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export function GET() {
  const bundled=path.join(process.cwd(), 'data/coupang-winter-food.json');
  const files=process.env.COUPANG_FOOD_PUBLIC_FILE?[process.env.COUPANG_FOOD_PUBLIC_FILE,bundled]:[bundled];
  for(const file of files){
    try {
      const feed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(feed.products)) continue;
      return Response.json({ products: feed.products }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {}
  }
  return Response.json({ products: [] }, { headers: { 'Cache-Control': 'no-store' } });
}
