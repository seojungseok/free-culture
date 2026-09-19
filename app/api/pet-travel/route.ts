import { NextResponse } from 'next/server';
import { getPetTravelPlaces, petOverview } from '@/lib/petTravel';

export const revalidate = false;
export const dynamic = 'force-static';
export async function GET() {
  const items = getPetTravelPlaces().map(p => ({
    id:p.id,title:p.title,address:p.address || p.addr || '',area:p.area || '',
    image:p.image || '',type:p.type || '',summary:petOverview(p).slice(0,180),
  }));
  return NextResponse.json({items,total:items.length,source:'pet-reviewed-cache'});
}
