import index from '@/data/event-route-ids.json';
const ids=new Set(index.ids);

export function missingEventRoute(path:string) {
  const match=/^\/event\/([^/]+)\/?$/.exec(path);
  return Boolean(match&&!ids.has(match[1]));
}

export const missingEventHtml='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>행사를 찾을 수 없어요 · 주말에 뭐하지?</title><style>body{margin:0;color:#172439;font-family:system-ui,sans-serif}main{max-width:640px;margin:12vh auto;padding:24px}h1{font-size:28px;line-height:1.5}p{color:#52647a;line-height:1.9}nav{display:flex;flex-wrap:wrap;gap:16px;margin-top:24px}a{display:inline-flex;align-items:center;min-height:44px;color:#245b75;font-weight:700}</style></head><body><main><h1>행사를 찾을 수 없어요</h1><p>등록된 자료에서 이 행사를 찾을 수 없습니다.<br>현재 열리는 공연·전시와 무료 행사를 찾아보세요.</p><nav aria-label="문화행사 찾아보기"><a href="/events">문화행사 찾기</a><a href="/free">무료 행사</a><a href="/weekend">이번 주말</a><a href="/">홈으로</a></nav></main></body></html>';
