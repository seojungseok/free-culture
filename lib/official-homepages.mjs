// Independently verified corrections take priority over an older provider URL.
// Sokcho: institution's contact page and 2026 culture programme checked 2026-10-15.
export function correctedHomepage(contentId, homepage = '') {
  return String(contentId) === '130344' ? 'https://sokchocul.or.kr/' : homepage;
}
