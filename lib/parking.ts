import 'server-only';
import snapshot from '@/data/parking.json';
import { nearbyParking, type Parking } from './parkingRules';
export const PARKING_SOURCE = 'https://www.data.go.kr/data/15099883/openapi.do';
export const parkingSnapshot = snapshot as {collectedAt:string;realtimePages:number[];pageSize:number;lots:Parking[]};
export function parkingFor(anchor:{lon:number;lat:number;area:string;address?:string}) {
 const age=Date.now()-Date.parse(parkingSnapshot.collectedAt);
 if(!Number.isFinite(age)||age<0||age>30*86400000)return [];
 return nearbyParking(parkingSnapshot.lots,anchor);
}
