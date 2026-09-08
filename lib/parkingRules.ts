/** Pure rules shared by the collector, server and tests. No credentials or network. */
export type Parking = { id: string; name: string; address: string; area: string; lat: number; lon: number; spaces?: number; basicMinutes?: number; basicWon?: number; freeMinutes?: number; hours?: Record<string, string>; realtimePage?: number };
export type ParkingRow = Record<string, unknown>;
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Holiday'];
export const AREA_NAMES: Record<string,string> = { 서울특별시:'서울', 부산광역시:'부산', 대구광역시:'대구', 인천광역시:'인천', 광주광역시:'광주', 대전광역시:'대전', 울산광역시:'울산', 세종특별자치시:'세종', 경기도:'경기', 강원특별자치도:'강원', 강원도:'강원', 충청북도:'충북', 충청남도:'충남', 전북특별자치도:'전북', 전라북도:'전북', 전라남도:'전남', 경상북도:'경북', 경상남도:'경남', 제주특별자치도:'제주', 제주도:'제주' };
export function areaName(value: string) { const first = value.trim().split(/\s/)[0]; return AREA_NAMES[first] || (Object.values(AREA_NAMES).includes(first) ? first : ''); }
export function numberOrMissing(value: unknown): number | undefined { if (typeof value !== 'string' && typeof value !== 'number') return; if (String(value).trim() === '') return; const n=Number(value); return Number.isFinite(n) && n >= 0 ? n : undefined; }
export function validPoint(lon: number, lat: number) { return Number.isFinite(lon) && Number.isFinite(lat) && lon>=124 && lon<=132 && lat>=33 && lat<=39.5; }
export function kmBetween(lon: number,lat: number,lon2: number,lat2: number) { if(!validPoint(lon,lat)||!validPoint(lon2,lat2)) return Infinity; const rad=Math.PI/180; const h=Math.sin((lat2-lat)*rad/2)**2+Math.cos(lat*rad)*Math.cos(lat2*rad)*Math.sin((lon2-lon)*rad/2)**2; return 6371*2*Math.asin(Math.sqrt(Math.min(1,h))); }
export function facility(row: ParkingRow): Parking | null {
 const id=String(row.prk_center_id||''),name=String(row.prk_plce_nm||'').trim(),address=String(row.prk_plce_adres||'').trim(),area=areaName(String(row.prk_plce_adres_sido||address));
 const lat=Number(row.prk_plce_entrc_la),lon=Number(row.prk_plce_entrc_lo);
 if(!/^[\d-]{5,40}$/.test(id)||!name||!address||!area||!validPoint(lon,lat)||areaName(address)!==area) return null;
 return {id,name,address,area,lat,lon,spaces:numberOrMissing(row.prk_cmprt_co)};
}
function time(value: unknown) { const v=String(value||''); if(!/^(?:[01]\d|2[0-3])[0-5]\d[0-5]\d$/.test(v)&&v!=='240000')return; return v.slice(0,2)+':'+v.slice(2,4); }
export function operation(row: ParkingRow): Pick<Parking,'basicMinutes'|'basicWon'|'freeMinutes'|'hours'> {
 const basic=(row.basic_info||{}) as ParkingRow; const hours:Record<string,string>={};
 for(const day of DAYS){const value=(row[day]||{}) as ParkingRow;const start=time(value.opertn_start_time),end=time(value.opertn_end_time);if(start&&end&&start!==end&&start!=='24:00')hours[day]=start+'–'+end;}
 return {basicMinutes:numberOrMissing(basic.parking_chrge_bs_time),basicWon:numberOrMissing(basic.parking_chrge_bs_chrge),freeMinutes:numberOrMissing(row.opertn_bs_free_time),hours};
}
export function mergeParking(facilities: ParkingRow[], operations: ParkingRow[], realtimePages: {page:number;rows:ParkingRow[]}[]) {
 const byId=new Map<string,Parking>(), rejected=new Set<string>(), ops=new Map<string,ReturnType<typeof operation>>(), conflictingOps=new Set<string>();let invalid=0;
 for(const row of facilities){const p=facility(row);if(!p){invalid++;continue;}const previous=byId.get(p.id);if(previous&&(kmBetween(previous.lon,previous.lat,p.lon,p.lat)>0.05||previous.name!==p.name||previous.area!==p.area))rejected.add(p.id);else if(previous&&previous.spaces!==p.spaces)previous.spaces=undefined;else if(!previous)byId.set(p.id,p);}
 // Provider duplicates sometimes assign one coordinate to unrelated names; exclude those clusters.
 const points=new Map<string,Set<string>>();for(const p of byId.values()){const key=p.lon.toFixed(5)+','+p.lat.toFixed(5);const names=points.get(key)||new Set<string>();names.add(p.name);points.set(key,names);}
 for(const p of byId.values())if((points.get(p.lon.toFixed(5)+','+p.lat.toFixed(5))?.size||0)>2)rejected.add(p.id);
 for(const row of operations){const id=String(row.prk_center_id||'');const op=operation(row),old=ops.get(id);if(old&&JSON.stringify(old)!==JSON.stringify(op))conflictingOps.add(id);else ops.set(id,op);}
 const rt=new Map<string,number>();for(const group of realtimePages)for(const row of group.rows){const id=String(row.prk_center_id||'');if(!rt.has(id))rt.set(id,group.page);}
 const lots=[...byId.values()].filter(p=>!rejected.has(p.id)).map(p=>({...p,...(!conflictingOps.has(p.id)?ops.get(p.id):{}),realtimePage:rt.get(p.id)}));
 return {lots,quality:{facilityRows:facilities.length,operationRows:operations.length,invalidFacilities:invalid,conflictingFacilityIds:rejected.size,conflictingOperationIds:conflictingOps.size,validFacilities:lots.length,withOperations:lots.filter(p=>ops.has(p.id)&&!conflictingOps.has(p.id)).length,withRealtime:lots.filter(p=>p.realtimePage).length}};
}
export function nearbyParking(lots: Parking[], anchor: {lon:number;lat:number;area:string;address?:string},limit=3){const area=areaName(anchor.area);if(!area||!validPoint(anchor.lon,anchor.lat)||(anchor.address&&areaName(anchor.address)&&areaName(anchor.address)!==area))return [];const seen=new Set<string>();return lots.filter(p=>p.area===area).map(p=>({...p,distanceKm:kmBetween(anchor.lon,anchor.lat,p.lon,p.lat)})).filter(p=>p.distanceKm<=0.7).sort((a,b)=>a.distanceKm-b.distanceKm).filter(p=>{const key=p.name+'|'+p.address;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,limit);}
export function realtimeValue(rows:ParkingRow[],id:string){const matches=rows.filter(r=>r.prk_center_id===id);if(!matches.length)return null;const values=matches.map(r=>({available:numberOrMissing(r.pkfc_Available_ParkingLots_total),total:numberOrMissing(r.pkfc_ParkingLots_total)}));const first=values[0];if(first.available===undefined||first.total===undefined||!Number.isInteger(first.available)||!Number.isInteger(first.total)||first.total<=0||first.available>first.total||values.some(v=>v.available!==first.available||v.total!==first.total))return null;return first as {available:number;total:number};}
