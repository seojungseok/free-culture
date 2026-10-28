export function cachedOverview(cache, id) {
  return String(cache[id] || '').replace(/<[^>]*>/g, '').trim();
}

export function withUsableOverview(places, cache, minimum = 200) {
  return places.filter(place => cachedOverview(cache, place.id).length >= minimum);
}
