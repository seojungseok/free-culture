import {winterCourseImage} from './winterCourseImage.mjs';

// Only fully validated, published courses are made visible or included in the sitemap.
export function isPublicWinterCourse(course, now = new Date()) {
  const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
  if (!course || typeof course !== 'object' || course.status !== 'published' || !nonempty(course.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(course.slug)) return false;
  if (!nonempty(course.id) || !nonempty(course.title) || !nonempty(course.area) || !nonempty(course.intro)) return false;
  if (!['당일', '1박2일'].includes(course.duration) || !course.sourceCourseId) return false;
  const pub = Date.parse(course.publishedAt || '');
  const checked = Date.parse(course.validation?.checkedAt || '');
  if (!Number.isFinite(pub) || pub > now.getTime() || !Number.isFinite(checked) || checked > now.getTime()) return false;
  const daytrip = course.validation?.version === 2 && course.validation?.sourceKind === 'naver-official-tour-api';
  const overnight = course.validation?.version === 3 && course.validation?.sourceKind === 'naver-official-tour-api';
  const capitalDaytrip = course.validation?.version === 4 && course.validation?.sourceKind === 'official-tour-api';
  const editorial = daytrip || overnight || capitalDaytrip;
  if ((!editorial && (course.validation?.version !== 1 || course.validation?.sourceKind !== 'cached-tour-data')) || !Array.isArray(course.validation?.checks)) return false;
  if (daytrip && (course.duration !== '당일' || !['official-sources','photos','daytrip'].every(c=>course.validation.checks.includes(c)))) return false;
  if (capitalDaytrip && (course.duration !== '당일' || !['official-sources','photos','daytrip'].every(c=>course.validation.checks.includes(c)))) return false;
  if (overnight && (course.duration !== '1박2일' || !['official-sources','photos','overnight','day-plan'].every(c=>course.validation.checks.includes(c)))) return false;
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
  if (editorial && (!course.sources?.length || !course.stops.every(stop=>nonempty(stop.description)))) return false;
  if (daytrip && !course.stops.every(stop=>stop.photo?.reviewed === true)) return false;
  if (capitalDaytrip) {
    if (course.stops.length < 2 || !nonempty(course.startPoint) || !nonempty(course.transport) || !nonempty(course.durationLabel) || course.intro.length < 80 || !Array.isArray(course.sections) || course.sections.length < 2) return false;
    if (!Array.isArray(course.sources) || course.sources.length < 2 || !course.sources.every(source=>{
      const checkedAt=Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt||'')?source.checkedAt+'T00:00:00+09:00':source.checkedAt||'');
      try{return new URL(source.url).protocol==='https:' && Number.isFinite(checkedAt) && checkedAt<=now.getTime();}catch{return false;}
    })) return false;
    const all=[];
    for (const stop of course.stops) {
      if (!nonempty(stop.addr) || !nonempty(stop.timeLabel) || !nonempty(stop.stay) || !nonempty(stop.description) || stop.description.length < 80) return false;
      try{if(new URL(stop.officialUrl).protocol!=='https:')return false;}catch{return false;}
      if(!course.sources.some(source=>source.url===stop.officialUrl))return false;
      if(stop.gallery!=null&&!Array.isArray(stop.gallery))return false;
      for(const photo of [stop.photo,...(stop.gallery||[])].filter(Boolean)){
        if(String(photo.placeId||'')!==String(stop.placeId)||photo.kind!=='tour-api'||photo.copyrightType!=='Type1'||!winterCourseImage({image:photo}))return false;
        all.push(photo);
      }
    }
    if(new Set(all.map(photo=>photo.src)).size<2 || new Set(all.map(photo=>photo.sourceUrl)).size<2 || !winterCourseImage({image:course.image}) || !all.some(photo=>photo.src===course.image.src && String(photo.placeId)===String(course.image.placeId)))return false;
  }
  if (overnight) {
    if (course.sources.length < 2 || !course.sources.every(source=>{
      const value=source.checkedAt || '', checkedAt=Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T00:00:00+09:00':value);
      return /^https:\/\//.test(source.url) && Number.isFinite(checkedAt) && checkedAt<=now.getTime();
    })) return false;
    if (!days.every(day=>course.stops.filter(stop=>stop.day===day).length>=2)) return false;
    if (course.stops.some((stop,index)=>index>0 && stop.day<course.stops[index-1].day)) return false;
    if (course.stops.some(stop=>!/^https:\/\//.test(stop.officialUrl || '') || stop.description.length<100 || (stop.photo && stop.photo.reviewed!==true))) return false;
    if (course.stops.some(stop=>stop.gallery!=null && (!Array.isArray(stop.gallery) || stop.gallery.some(photo=>photo?.reviewed!==true)))) return false;
    const photos=course.stops.flatMap(stop=>[stop.photo,...(stop.gallery||[])]).filter(Boolean);
    if (new Set(photos.filter(photo=>photo.reviewed===true).map(photo=>photo.src)).size<3 || course.image?.reviewed!==true) return false;
    if (!photos.every(photo=>winterCourseImage({image:photo})) || !winterCourseImage({image:course.image}) || !photos.some(photo=>photo.src===course.image.src)) return false;
    if (!nonempty(course.overnightArea) || course.intro.length<100 || !Array.isArray(course.sections) || course.sections.length<3) return false;
  }
  return Array.isArray(course.sections) && course.sections.length > 0 && course.sections.every((section) =>
    section && nonempty(section.heading) && Array.isArray(section.paragraphs) && section.paragraphs.length > 0 && section.paragraphs.every(nonempty));
}
