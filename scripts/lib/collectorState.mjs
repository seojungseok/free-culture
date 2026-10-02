// Established IDs survive incomplete refreshes; missing list fields retain verified facts.
export function mergeCollectedRecord(previous, next, checkedAt) {
  const incoming = Object.fromEntries(Object.entries(next).filter(([key, value]) =>
    value !== null && value !== undefined && (value !== "" || previous?.[key] === undefined || previous?.[key] === "")));
  return { ...(previous || {}), ...incoming, checkedAt };
}

export function checkedSnapshot(previous, records, field, { calls, failures = 0, complete = false, checkedAt = new Date().toISOString() }) {
  return { ...previous, generatedAt: checkedAt, count: records.length, [field]: records,
    incompleteRefresh: !complete,
    refresh: { checkedAt, complete, calls, failures, checkedRecords: records.filter((record) => record.checkedAt === checkedAt).length } };
}
