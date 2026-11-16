import fs from 'node:fs';
import path from 'node:path';

export function eventRouteIds(...sources) {
  if(sources.some(source=>!Array.isArray(source.events)))throw new Error('Event route source is missing');
  const ids=[...new Set(sources.flatMap(source=>source.events.map(event=>String(event.id))))].sort();
  if(!ids.length||ids.some(id=>!id||id==='undefined'||/[/?#]/.test(id)))throw new Error('Refusing an incomplete event route index');
  return ids;
}
export function buildEventRouteIndex(root) {
  const sources=['events.json','events-archive.json','curated-events.json'].map(file=>JSON.parse(fs.readFileSync(path.join(root,'data',file),'utf8')));
  const target=path.join(root,'data','event-route-ids.json'),output=JSON.stringify({ids:eventRouteIds(...sources)})+'\n';
  if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)fs.writeFileSync(target,output);
}
