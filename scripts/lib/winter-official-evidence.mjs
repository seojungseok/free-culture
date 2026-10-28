import { safeEvidence } from './winter-course.mjs';

// Only these known public operators may be queried automatically. URLs originate
// from stored TourAPI data; redirects and unlisted hosts are never followed.
export const OFFICIAL_HOSTS = new Set(['museum.seoul.go.kr','www.mmca.go.kr','www.museum.go.kr','www.jeju.go.kr','www.busan.go.kr','www.ansan.go.kr','www.yongin.go.kr','www.bucheon.go.kr','www.ganghwa.go.kr','www.anseong.go.kr','www.hongcheon.go.kr','www.seoul.go.kr','www.daejeon.go.kr','www.yangju.go.kr','www.csc.go.kr','kculturesquare.kocca.kr','www.ntok.go.kr','tour.gwangju.go.kr','museum.busan.go.kr','tour.paju.go.kr','oidomuseum.siheung.go.kr','www.osan.go.kr','www.ngii.go.kr']);
const indoor = /박물관|미술관|전시관|과학관/;
const closed = /영업\s*종료|운영\s*종료|영구\s*폐쇄|폐관\s*안내|폐업|철거\s*완료|임시\s*휴관|장기\s*휴관|전면\s*휴관/;
const cleanHtml = html => String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();

export async function inspectOfficialPlace(place, detail, fetchImpl = fetch, now = new Date()) {
  const name = String(place?.title || '').trim();
  if (!/^\d+$/.test(String(place?.id || '')) || !indoor.test(name) || /거리|마을|공원|광장/.test(name) || !detail?.homepage) return null;
  let url; try { url = new URL(detail.homepage); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || !OFFICIAL_HOSTS.has(url.hostname) || url.port || url.pathname === '/') return null;
  try {
    let current=url.href, res;
    for(let n=0;n<3;n++) {
      res=await fetchImpl(current,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{Accept:'text/html'}});
      if (![301,302,303,307,308].includes(res.status)) break;
      const location=res.headers.get('location'); if(!location)return null;
      const next=new URL(location,current);
      if(next.protocol!=='https:' || next.username || next.password || next.port || !OFFICIAL_HOSTS.has(next.hostname))return null;
      current=next.href;
    }
    if (res.status !== 200 || !/^text\/html\b/i.test(res.headers.get('content-type') || '') || Number(res.headers.get('content-length') || 0) > 1024*1024) return null;
    let size=0; const parts=[];
    for await (const chunk of res.body) { size += chunk.length; if(size>1024*1024)return null; parts.push(chunk); }
    const html=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts));
    const text=cleanHtml(html);
    if (!text.includes(name) || closed.test(text)) return null;
    // A current fetch time is never treated as the original publication date.
    // Prefer a shared excerpt. Otherwise use a short official description that
    // names this exact venue; unrelated navigation text is never accepted.
    const blocks = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi)].map(match=>cleanHtml(match[1]));
    const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match=>match[0]).filter(tag=>/(?:name|property)\s*=\s*["'](?:description|og:description)["']/i.test(tag)).map(tag=>/content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] || '');
    const visitorFeature=sentence => sentence.includes(name) && /(?:입니다|합니다|있습니다|한다|이다|있다)[.!?。]$/.test(sentence) && !/채용|면접|서류|인력|공고|지원자|모집|채점|합격|환영합니다|홈페이지에 오신/.test(sentence);
    const official = [...metas,...blocks].flatMap(block=>safeEvidence(cleanHtml(block))).find(visitorFeature);
    let feature=safeEvidence(detail.overview).find(sentence=>text.includes(sentence) && visitorFeature(sentence)) || official;
    let method='official-page-source-check';
    if (!feature) {
      // An exact document title or H1 establishes identity only. A name found
      // merely in navigation or an unrelated listing is insufficient.
      const titles=[...html.matchAll(/<(?:title|h1)\b[^>]*>([\s\S]*?)<\/(?:title|h1)\s*>/gi)].map(match=>cleanHtml(match[1]));
      const identity=titles.some(title=>title.split(/\s*[|｜–—:]\s*/).some(part=>part.trim()===name));
      if(!identity)return null;
      feature=`${name}: 공공기관이 공식 홈페이지에서 안내하는 문화시설입니다.`;
      method='official-title-identity-only';
    }
    return {name,eligible:true,verifiedAt:now.toISOString(),sourceUrl:current,feature,winterReason:'겨울 여행을 계획할 때 방문일의 실내 공간과 전시 안내를 확인해 보세요.',verificationMethod:method};
  } catch { return null; }
}
