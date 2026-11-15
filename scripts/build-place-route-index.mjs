import fs from 'node:fs';
import path from 'node:path';

export function placeRouteIds(places, restaurants, duplicates) {
  if (!places.spots?.length || !restaurants.restaurants?.length || !duplicates.ids) {
    throw new Error('Public place route sources are missing; refusing an incomplete route index');
  }
  // Restaurant and camping aliases must keep reaching their existing redirects.
  return [...new Set([...places.spots.map(item => item.id),
    ...restaurants.restaurants.map(item => item.id), ...Object.keys(duplicates.ids), '3353336'])].sort();
}

export function buildPlaceRouteIndex(root) {
  const read = file => JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'));
  const places = read('places.json'), restaurants = read('restaurants.json'), duplicates = read('camping-dupe-ids.json');
  const ids = placeRouteIds(places, restaurants, duplicates);
  const placeIds = new Set(places.spots.map(item => item.id));
  const redirects = Object.fromEntries([
    ...restaurants.restaurants.filter(item => !placeIds.has(item.id)).map(item => [item.id, `/food/spot/${item.id}`]),
    ...Object.entries(duplicates.ids).map(([id, target]) => [id, target ? `/camping/${target}` : '/camping']),
  ].sort(([a], [b]) => a.localeCompare(b)));
  const target = path.join(root, 'data', 'place-route-ids.json');
  const output = JSON.stringify({ids, redirects}) + '\n';
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) fs.writeFileSync(target, output);
}
