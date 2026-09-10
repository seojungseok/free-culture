import {NextResponse} from 'next/server';
import {nearbyPool} from '@/lib/nearData';
import {NEAR_KINDS,NEAR_RADII,queryNearby,validPoint,type NearKind} from '@/lib/nearSearch';
import {todayYmd} from '@/lib/dates';
import {SIDO_LIST} from '@/lib/classify';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const sp=new URL(req.url).searchParams;
 const hasCoords=sp.has('lat')||sp.has('lng');
 const point=hasCoords?{lat:Number(sp.get('lat')),lng:Number(sp.get('lng'))}:undefined;
 const area=sp.get('area')||undefined,kind=(sp.get('kind')||'all') as NearKind,radius=Number(sp.get('radius')||10);
 const offset=Number(sp.get('offset')||0);
 if((point&&(!sp.get('lat')||!sp.get('lng')||!validPoint(point)))||(!point&&!SIDO_LIST.includes(area||''))||!NEAR_KINDS.some(k=>k.value===kind)||!NEAR_RADII.some(r=>r===radius)||!Number.isInteger(offset)||offset<0||offset>100000)return NextResponse.json({error:'위치나 검색 조건을 다시 확인해 주세요.'},{status:400});
 const result=queryNearby(nearbyPool(),{point,area,kind,radius,offset,limit:12},todayYmd());
 return NextResponse.json({...result,mode:point?'location':'region',radius,kind},{headers:{'Cache-Control':'private, no-store'}});
}
