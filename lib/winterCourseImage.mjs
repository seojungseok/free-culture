/** Only reviewed pictures with a clear source may appear with a course. */
export function winterCourseImage(course) {
  const photo = course.image;
  if (!photo || photo.reviewed !== true || !['tour-api', 'ai'].includes(photo.kind)) return null;
  if (![photo.src, photo.alt, photo.caption, photo.credit].every((text) => typeof text === 'string' && text.trim())) return null;
  if (!Number.isInteger(photo.width) || !Number.isInteger(photo.height) || photo.width < 1 || photo.height < 1) return null;
  if (photo.kind === 'ai') {
    if (!/^\/winter-images\/[a-zA-Z0-9_-]+\.(?:webp|jpg|png)$/.test(photo.src)) return null;
  } else {
    try {
      const url = new URL(photo.src);
      if (url.protocol !== 'https:' || url.hostname !== 'tong.visitkorea.or.kr') return null;
    } catch { return null; }
  }
  return photo;
}
