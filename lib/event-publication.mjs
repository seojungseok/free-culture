/** An explicit publishing deadline is exclusive and always includes a timezone. */
export function eventExpiryTime(event) {
  if (!event?.expiresAt) return null;
  if (typeof event.expiresAt !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/.test(event.expiresAt)) return NaN;
  return Date.parse(event.expiresAt);
}
export function isEventPublished(event, now = Date.now()) {
  const expires = eventExpiryTime(event);
  return expires === null || (Number.isFinite(expires) && now < expires);
}
export function eventPublicationPaths(event) {
  return [`/event/${event.id}`, `/event/${event.id}/`, `/festivals/event-${event.id}`, `/festivals/event-${event.id}/`, `/kids/c/ev-${event.id}`, `/kids/c/ev-${event.id}/`,
    ...[event.imgUrl, ...(event.gallery || []).map(image => image.src)].filter(path => typeof path === 'string' && path.startsWith('/event-posters/'))];
}
export function expiredEventForPath(events, pathname, now = Date.now()) {
  return events.find(event => !isEventPublished(event, now) && eventPublicationPaths(event).includes(pathname));
}
export function expiredEventSelectors(ids) {
  return ids.filter(id => /^[a-zA-Z0-9_-]+$/.test(id)).flatMap(id =>
    [`/event/${id}`, `/festivals/event-${id}`, `/kids/c/ev-${id}`].flatMap(path => [
      `a[href="${path}"]`, `article:has(>a[href="${path}"])`, `li:has(>a[href="${path}"])`,
    ]));
}
