import {NextResponse} from 'next/server';
import {getParkingRealtime} from '@/lib/parkingRealtime';
export const runtime='nodejs';
export async function GET(request:Request){const id=new URL(request.url).searchParams.get('id')||'';if(!/^[\d-]{5,40}$/.test(id))return NextResponse.json({state:'unavailable'},{status:400});try{return NextResponse.json(await getParkingRealtime(id),{headers:{'Cache-Control':'private, no-store'}});}catch{return NextResponse.json({state:'unavailable'},{headers:{'Cache-Control':'private, no-store'}});}}
