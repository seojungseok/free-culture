// Public providers occasionally return documents in an image field.
export function publicImageUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(url.pathname)) return '';
    url.protocol = 'https:';
    return url.href;
  } catch { return ''; }
}
