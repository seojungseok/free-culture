import index from '@/data/place-route-ids.json';

const ids = new Set(index.ids);
const redirects: Record<string, string> = index.redirects;
export function placeRouteRedirect(path: string) {
  const match = /^\/places\/spot\/([^/]+)\/?$/.exec(path);
  return match ? redirects[match[1]] : undefined;
}
export function missingPlaceRoute(path: string) {
  const match = /^\/places\/spot\/([^/]+)\/?$/.exec(path);
  return Boolean(match && !ids.has(match[1]));
}

export const missingPlaceHtml = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,follow"><title>페이지를 찾을 수 없어요 · 주말에 뭐하지?</title><style>body{margin:0;color:#142b48;font-family:system-ui,sans-serif}header{padding:24px;border-bottom:1px solid #e1e7ef}a{color:#245cb4}header a{text-decoration:none;font-weight:800}main{max-width:720px;margin:12vh auto;padding:24px;text-align:center}h1{font-size:clamp(24px,5vw,32px)}p{line-height:1.8;color:#52637b}nav{display:flex;flex-wrap:wrap;justify-content:center;gap:20px;margin-top:28px}</style></head><body><header><a href="/">주말에 뭐하지?</a></header><main><h1>페이지를 찾을 수 없어요</h1><p>현재 공개된 자료에서 이 장소를 찾을 수 없습니다.<br>다른 나들이 장소와 이번 주말 갈 곳을 찾아보세요.</p><nav aria-label="다른 나들이 찾기"><a href="/">홈으로</a><a href="/places">지역별 나들이</a><a href="/weekend">이번 주말 행사</a><a href="/experiences">체험·교육</a></nav></main></body></html>`;
