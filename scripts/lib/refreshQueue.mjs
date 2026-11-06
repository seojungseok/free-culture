// A populated cache is not evidence that its operating information is current.
export const REFRESH_DAYS = 30;
export function needsRefresh(record, checkedAt = record?.checkedAt, now = Date.now()) {
  const time = Date.parse(checkedAt || '');
  return !record || !Number.isFinite(time) || time > now || now - time >= REFRESH_DAYS * 86400000;
}
export function refreshQueue(rows, records, checks = {}, now = Date.now()) {
  return rows.filter(row => needsRefresh(records[row.id], checks[row.id] || records[row.id]?.checkedAt, now))
    .sort((a, b) => {
      const stamp = id => Date.parse(checks[id] || records[id]?.checkedAt || '') || 0;
      return stamp(a.id) - stamp(b.id);
    });
}
