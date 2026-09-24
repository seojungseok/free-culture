// Keep previously published event URLs resolvable after the active feed drops them.
export function mergeEventArchive(archived, previous, active, today) {
  const activeIds = new Set(active.map(event => event.id));
  const byId = new Map();
  const eligible = event => event?.id && event.title && /^\d{8}$/.test(event.endDate || '') && event.endDate < today && !activeIds.has(event.id);
  for (const event of archived) if (eligible(event)) byId.set(event.id, event);
  // The outgoing active record is fresher than an older archived copy.
  for (const event of previous) if (eligible(event)) byId.set(event.id, event);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}
