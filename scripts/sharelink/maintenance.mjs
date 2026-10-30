// Sharelink's announced maintenance: 2026-10-30 00:00 to 2026-11-05 00:00 KST.
export const maintenanceStart = Date.parse('2026-10-29T15:00:00Z');
export const maintenanceEnd = Date.parse('2026-11-04T15:00:00Z');
export function isSharelinkMaintenance(now = Date.now()) {
  return now >= maintenanceStart && now < maintenanceEnd;
}
