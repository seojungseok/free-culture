import {contentErrors,publicationGuarantee} from './content-policy.mjs';
import {TICKET_POLICY} from '../../lib/ticket-guarantee.mjs';
export const kstDay = (date = new Date()) => date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
export const nextDay = day => new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString().slice(0,10);
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const recent = (value, now) => validDate(value) && Date.parse(value) <= +now && +now-Date.parse(value) <= 7*86400000;
export function readiness(article, products, now = new Date()) {
  const errors = contentErrors(article, now, products);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || '')) errors.push('글 주소 확인');
  if (!article.placeId || !article.area || !article.address || !article.theme) errors.push('장소·주소·지역·테마 확인');
  if (article.review?.status !== 'approved' || !recent(article.review?.checkedAt, now)) errors.push('글 검수 또는 재검수 필요');
  if (!article.title || !article.description || !article.intro || !article.sections?.length || !article.sources?.some(s=>s.kind==='official'||s.kind==='waug')) errors.push('본문·공식 출처 필요');
  if (!article.internalLinks?.length || article.internalLinks.some(l=>!l.verifiedAt || !/^\/(?!\/)/.test(l.href))) errors.push('관련 내부링크 확인');
  if (!article.productIds?.length) errors.push('이용권 연결 필요');
  for (const id of article.productIds || []) {
    const p = products.find(p=>p.id===id);
    if (!p || p.eligibility !== 'eligible' || p.saleStatus !== 'available' || p.duplicateOf || p.placeId !== article.placeId || !recent(p.lastCheckedAt, now) || p.verification?.status !== 'approved' || !p.verification?.source || p.waterReviewRequired || !/^https:\/\/www\.waug\.com\/r\/[A-Za-z0-9]+$/.test(p.affiliateUrl)) errors.push(`상품 검수 필요: ${id}`);
    if (p?.validFrom && p.validFrom > kstDay(now)) errors.push(`이용 시작 전: ${id}`);
    if (p?.validUntil && p.validUntil < kstDay(now)) errors.push(`이용기간 종료: ${id}`);
  }
  const im = article.thumbnail;
  const original=im?.kind==='waug-original';
  const generated=im?.kind==='ai-generated';
  const assetValid=original?im.unedited===true&&/^https:\/\/d2mgzmtdeipcjp\.cloudfront\.net\/files\/good\//.test(im.url||'')&&im.width>0&&im.height>0&&/^image\/(jpeg|png|webp)$/.test(im.mimeType||''):im?.width===1200&&im?.height===630&&im?.url?.startsWith('https://mwohaji.kr/ticket-images/')&&im?.mimeType==='image/jpeg'&&(im.bytes<=250*1024||im.qualityNote);
  if (!im || im.status !== 'approved' || !assetValid || !im.alt || !im.sha256 || !im.inputHash || !im.uploadedAt || !im.verifiedAt || !im.mobileCheckedAt || !im.desktopCheckedAt || !im.ogCheckedAt || !im.bytes) errors.push('대표 이미지·모바일·PC·OG 검수 필요');
  if (generated) {
    if(im.sources?.length || !['OpenAI imagegen','OpenAI Images API'].includes(im.generation?.provider) || !im.generation?.promptHash || !im.generation?.generatedAt || !im.generation?.originalGeneration || !im.generation?.visualCheckedAt || !im.disclosure?.includes('AI 생성')) errors.push('AI 이미지 제작 근거·표시 확인');
  } else if (!im?.sources?.length || im.sources.some(s=>!s.commercialAllowed || (!original&&!s.editAllowed) || !s.placeMatched || !s.rightsUrl || !s.checkedAt || !s.credit)) errors.push('대표 사진 권리·장소 일치 확인');
  if(original && im.sources?.some(s=>s.faceReview?.status!=='no-identifiable-faces')) errors.push('대표 사진 얼굴 검수 필요');
  if ((!article.photos?.length && article.contentPolicyVersion!==TICKET_POLICY) || (article.photos||[]).some(p=>p.kind==='ai-generated'
    ? !p.url?.startsWith('https://mwohaji.kr/ticket-images/') || !p.alt || !p.credit?.includes('AI 생성') || !p.generation?.promptHash || !p.generation?.originalGeneration || !p.generation?.visualCheckedAt || !p.verifiedAt || !p.necessityNote
    : !p.url || !p.alt || !p.credit || !p.placeMatched || !p.rightsUrl || !p.commercialAllowed || !p.checkedAt)) errors.push('본문 사진 권리·장소 일치 확인');
  if(article.photos?.some(p=>p.url?.includes('cloudfront.net/files/good/') && p.faceReview?.status!=='no-identifiable-faces')) errors.push('본문 사진 얼굴 검수 필요');
  // Different query-string sizes of one source are still the same cut.
  const imageKey = url => { try { const u=new URL(url); return u.origin+u.pathname; } catch { return url; } };
  const bodyImages=(article.photos||[]).map(p=>imageKey(p.url));
  const rendered=new Set((article.sections||[]).filter(s=>Number.isInteger(s.photoIndex)&&article.photos?.[s.photoIndex]).map(s=>bodyImages[s.photoIndex]));
  if(article.contentPolicyVersion===TICKET_POLICY) {
    if(new Set(bodyImages).size!==bodyImages.length || bodyImages.includes(imageKey(im?.url)) || rendered.size!==bodyImages.length) errors.push('중복 없는 본문 사진 실제 배치 필요');
  } else if(bodyImages.length<2 || new Set(bodyImages).size!==bodyImages.length || bodyImages.includes(imageKey(im?.url)) || rendered.size<2) errors.push('서로 다른 본문 이미지 2장 이상 실제 배치 필요');
  return errors;
}

function ordered(candidates, day) {
  const result = [], areas = {}, themes = {};
  const age = a => Math.max(0, (Date.parse(day)-Date.parse(a.createdAt || day))/86400000);
  while (candidates.length) {
    candidates.sort((a,b)=> {
      const score = a => age(a)*10 + (a.editorialPriority ? Math.max(0,31-a.editorialPriority)*2 : 0) - (areas[a.area]||0)*30 - (themes[a.theme]||0)*15 + (a.area==='경기'?1:0);
      return score(b)-score(a) || a.slug.localeCompare(b.slug);
    });
    const a=candidates.shift(); result.push(a); areas[a.area]=(areas[a.area]||0)+1; themes[a.theme]=(themes[a.theme]||0)+1;
  }
  return result;
}

export function schedule(state, products, now = new Date()) {
  if (state.paused) return [];
  const ids=state.articles.map(a=>a.placeId);
  if(new Set(ids).size!==ids.length)throw new Error('같은 장소에 여러 글이 등록되었습니다. 이용권을 기존 글에 통합하세요.');
  const candidates=state.articles.filter(a=>!a.publishedAt && a.status!=='excluded' && !readiness(a,products,now).length);
  // Only future reservations are rearranged. Already-due reservations remain queued.
  const future=candidates.filter(a=>!a.scheduledAt);
  let day=nextDay(kstDay(now)); const scheduled=[];
  while (future.length) {
    const existing=state.history.filter(h=>h.day===day).length + candidates.filter(a=>a.scheduledAt?.slice(0,10)===day && !future.includes(a)).length;
    const batch=ordered([...future],day).slice(0,Math.max(0,30-existing));
    for(const a of batch){ a.scheduledAt=`${day}T06:00:00+09:00`; a.status='scheduled'; scheduled.push(a.slug); future.splice(future.indexOf(a),1); }
    day=nextDay(day);
  }
  for(const a of state.articles) if(!a.publishedAt && readiness(a,products,now).length && a.scheduledAt){a.scheduledAt=null;a.status='held';}
  return scheduled;
}

export function publish(state, products, now = new Date()) {
  if(state.paused) return [];
  const day=kstDay(now);
  const already=new Set(state.history.map(h=>h.slug));
  const limit=30;
  const remaining=Math.max(0,limit-state.history.filter(h=>h.day===day).length);
  const due=state.articles.filter(a=>a.status==='scheduled' && !a.publishedAt && !already.has(a.slug) && validDate(a.scheduledAt) && Date.parse(a.scheduledAt)<=+now);
  const eligible=[];
  for(const a of due){ const reasons=readiness(a,products,now); if(reasons.length){a.status='held';a.holdReasons=reasons;a.scheduledAt=null;}else eligible.push(a); }
  const result=ordered(eligible,day).slice(0,remaining);
  for(const a of result){
    if(a.contentPolicyVersion===TICKET_POLICY)a.publishedGuarantees=Object.fromEntries((a.productIds||[]).map(id=>{const p=products.find(p=>p.id===id);return [id,p?publicationGuarantee(a,p,now):null];}));
    a.status='published';a.publishedAt=now.toISOString();state.history.push({slug:a.slug,placeId:a.placeId,day,publishedAt:a.publishedAt});
  }
  return result.map(a=>a.slug);
}

export function launchNow(state,products,placeIds,now=new Date()) {
  if(state.paused)return [];
  if(state.publicationPolicy?.launchDay!==kstDay(now))throw new Error('최초 즉시 발행 승인일이 아닙니다.');
  const selected=new Set(placeIds);
  if(selected.size>30)throw new Error('최초 발행은 최대 30개 장소입니다.');
  if(new Set(state.articles.map(a=>a.placeId)).size!==state.articles.length)throw new Error('중복 장소 글');
  for(const a of state.articles.filter(a=>selected.has(a.placeId)&&!a.publishedAt)){
    const errors=readiness(a,products,now);
    if(errors.length){a.status='held';a.holdReasons=errors;continue;}
    a.status='scheduled';a.scheduledAt=now.toISOString();
  }
  const published=publish(state,products,now);
  for(const a of state.articles.filter(a=>selected.has(a.placeId)&&!a.publishedAt&&a.status==='scheduled')) a.scheduledAt=null;
  schedule(state,products,now);
  return published;
}

export function publicArticles(state, products) {
  return state.articles.filter(a=>a.status==='published' && a.publishedAt && state.history.some(h=>h.slug===a.slug)).map(a=>({
    slug:a.slug,placeId:a.placeId,placeName:a.placeName||a.thumbnail.copy?.placeName||'이 장소',title:a.title,description:a.description,intro:a.intro,area:a.area,address:a.address,theme:a.theme,
    ...(a.contentPolicyVersion===TICKET_POLICY?{contentPolicyVersion:TICKET_POLICY}:{}),
    ...Object.fromEntries(['editorialRevision','ticketComparison','faq','visitInfo'].filter(key=>a[key]!==undefined).map(key=>[key,a[key]])),
    thumbnail:{url:a.thumbnail.url,alt:a.thumbnail.alt,width:a.thumbnail.width,height:a.thumbnail.height,credit:a.thumbnail.disclosure || a.thumbnail.sources.map(s=>s.credit).join(' · '),...(a.contentPolicyVersion===TICKET_POLICY?{kind:a.thumbnail.kind,rightsUrl:a.thumbnail.sources?.[0]?.rightsUrl}: {})},
    photos:a.photos,sections:a.sections,internalLinks:a.internalLinks,sources:a.sources,publishedAt:a.publishedAt,checkedAt:a.review.checkedAt,
    tickets:a.productIds.map(id=>products.find(p=>p.id===id)).filter(p=>p && p.eligibility==='eligible' && p.saleStatus==='available' && !p.duplicateOf).map(p=>({verifiedBenefit:p.verifiedBenefit||null,label:p.optionLabel||'이용권',href:p.affiliateUrl,validUntil:p.validUntil||null,...(a.contentPolicyVersion===TICKET_POLICY?{priceGuarantee:a.publishedGuarantees?.[p.id]||null}:{})}))
  }));
}
