import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const key = process.env.PARKING_API_KEY || process.env.DATA_GO_KR_KEY;
if (!key) throw new Error('Parking service key is not configured');
for (const endpoint of process.argv[2] ? [process.argv[2]] : ['PrkSttusInfo', 'PrkOprInfo', 'PrkRealtimeInfo']) {
  const url = new URL('https://apis.data.go.kr/B553881/Parking/' + endpoint);
  url.search = new URLSearchParams({ serviceKey: decodeURIComponent(key), pageNo: process.argv[3] || '1', numOfRows: process.argv[4] || '10', format: '2' }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
    const raw = await response.text();
    let json; try { json = JSON.parse(raw); } catch { console.log(JSON.stringify({endpoint,status:response.status,json:false,bytes:raw.length})); continue; }
    const rows = json[endpoint] || [];
    console.log(JSON.stringify({endpoint,status:response.status,total:json.totalCount,code:json.resultCode,count:rows.length,unique:new Set(rows.map(r=>r.prk_center_id)).size,fields:[...new Set(rows.flatMap(Object.keys))],areas:[...new Set(rows.map(r=>r.prk_plce_adres_sido))],sample:rows.slice(0,3),last:rows.slice(-1)}, (name,value) => /key|token|authorization/i.test(name) ? '[redacted]' : value));
  } catch (error) { console.log(JSON.stringify({endpoint,error:error.name,cause:error.cause?.code})); }
}
