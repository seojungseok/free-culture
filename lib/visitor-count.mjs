// Keep the original public counter and namespace. Never create, set or reset it.
const BASE='https://abacus.jasoncameron.dev';
const NAMESPACE='weekendpick-kr';
export function visitorDay(date=new Date()){
 return new Date(date.getTime()+9*60*60*1000).toISOString().slice(0,10).replaceAll('-','');
}
export function createVisitorCounter({fetcher=fetch,now=()=>new Date()}={}){
 let cached=null;
 async function request(verb,key,allowMissing=false){
  const response=await fetcher(`${BASE}/${verb}/${NAMESPACE}/${key}`,{cache:'no-store',redirect:'error',headers:{Accept:'application/json'},signal:AbortSignal.timeout(5000)});
  if(allowMissing&&response.status===404)return 0;
  if(!response.ok)throw Error('Visitor counter unavailable');
  const data=await response.json();
  if(!Number.isSafeInteger(data?.value)||data.value<0)throw Error('Invalid visitor counter response');
  return data.value;
 }
 async function load(verb){
  const date=now(),day=visitorDay(date);
  const [total,today]=await Promise.all([request(verb,'total'),request(verb,'d'+day,verb==='get')]);
  const result={day,total,today};cached={...result,at:date.getTime()};return result;
 }
 return {
  async get(){const date=now();if(cached&&cached.day===visitorDay(date)&&date.getTime()-cached.at<20000){const {at,...result}=cached;return result;}return load('get');},
  async hit(){return load('hit');},
 };
}
