// Only fully validated, published courses are made visible or included in the sitemap.
export function isPublicWinterCourse(course, now = new Date()) {
  const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
  if (!course || typeof course !== 'object' || course.status !== 'published' || !nonempty(course.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(course.slug)) return false;
  if (!nonempty(course.id) || !nonempty(course.title) || !nonempty(course.area) || !nonempty(course.intro)) return false;
  if (!['당일', '1박2일'].includes(course.duration) || !course.sourceCourseId) return false;
  const pub = Date.parse(course.publishedAt || '');
  const checked = Date.parse(course.validation?.checkedAt || '');
  if (!Number.isFinite(pub) || pub > now.getTime() || !Number.isFinite(checked) || checked > now.getTime()) return false;
  if (course.validation?.version !== 1 || course.validation?.sourceKind !== 'cached-tour-data' || !Array.isArray(course.validation?.checks)) return false;
  if (!['identity', 'coordinates', 'route', 'text'].every((c) => course.validation.checks.includes(c))) return false;
  if (!Array.isArray(course.stops) || course.stops.length < 2 || course.stops.length > (course.duration === '당일' ? 3 : 6)) return false;
  const days = course.duration === '당일' ? [1] : [1, 2];
  if (!days.every((day) => course.stops.some((stop) => stop?.day === day))) return false;
  const ids = new Set();
  for (const stop of course.stops) {
    if (!stop || typeof stop !== 'object' || !/^\d+$/.test(String(stop.placeId || '')) || !nonempty(stop.name) || !days.includes(stop.day)) return false;
    if (stop.addr != null && typeof stop.addr !== 'string') return false;
    if (stop.officialUrl != null && typeof stop.officialUrl !== 'string') return false;
    const lat = Number(stop.mapy), lon = Number(stop.mapx);
    if (!(lat > 32 && lat < 40 && lon > 120 && lon < 132) || ids.has(String(stop.placeId))) return false;
    ids.add(String(stop.placeId));
  }
  if (course.sources != null && (!Array.isArray(course.sources) || !course.sources.every((source) => source && nonempty(source.title) && nonempty(source.url)))) return false;
  return Array.isArray(course.sections) && course.sections.length > 0 && course.sections.every((section) =>
    section && nonempty(section.heading) && Array.isArray(section.paragraphs) && section.paragraphs.length > 0 && section.paragraphs.every(nonempty));
}
