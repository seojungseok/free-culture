import type {NearPoint} from './nearSearch';
export const NEAR_SESSION='near-search-v2';
export function requestNearLocation():Promise<NearPoint>{
 return new Promise((resolve,reject)=>{
  if(!navigator.geolocation){reject(new Error('이 브라우저에서는 위치를 확인할 수 없어요. 지역을 직접 골라주세요.'));return;}
  navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude}),e=>reject(new Error(e.code===1?'위치 권한이 허용되지 않았어요. 지역을 직접 골라주세요.':'위치를 확인하지 못했어요. 다시 시도하거나 지역을 직접 골라주세요.')),{timeout:10000,maximumAge:0,enableHighAccuracy:false});
 });
}
