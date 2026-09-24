import fs from 'node:fs';
import path from 'node:path';

export const categories = ['요리 준비물', '캠핑 요리', '바비큐 요리', '요리 재료 체크리스트', '캠핑요리 가이드', '캠핑용품', '야외 놀이', '피크닉 준비', '여행 준비'];
export function safeImage(value) {
  return typeof value === 'string' && /^\/prep-images\/[a-zA-Z0-9_-]+\.(webp|jpg|png)$/.test(value);
}

export function validateShape(store) {
  if (!store || !Number.isInteger(store.version) || !Array.isArray(store.articles) || store.articles.length > 1000) throw Error('글 저장 형식 오류');
  const slugs = new Set();
  for (const article of store.articles) {
    if (!/^[a-z0-9-]{3,100}$/.test(article.slug || '') || !article.title || !article.description || !categories.includes(article.category) || !['draft', 'scheduled', 'published'].includes(article.status) || !Array.isArray(article.sections) || !article.cover || !Array.isArray(article.internalLinks)) throw Error('글 형식 확인 필요');
    if (slugs.has(article.slug)) throw Error('중복 URL');
    slugs.add(article.slug);
    const images = [article.cover, ...article.sections.map(section => section.image).filter(Boolean)];
    if (images.length > 4) throw Error('이미지는 대표 썸네일 포함 글당 최대 4장입니다.');
    for (const image of images) if (!safeImage(image.url) || !image.alt || image.width <= 0 || image.height <= 0) throw Error('이미지 형식 확인 필요');
    for (const section of article.sections) if (typeof section.heading !== 'string' || typeof section.text !== 'string') throw Error('본문 형식 확인 필요');
    if (article.checklist !== undefined && (!Array.isArray(article.checklist) || article.checklist.some(item => !item.id || !item.label || !item.role))) throw Error('체크리스트 형식 확인 필요');
    for (const link of article.internalLinks) if (!/^\/(camping|places|kids|course|season|weekend-prep)(\/[^?#]*)?$/.test(link.href) || link.href.includes('..')) throw Error('내부 링크 경로 확인 필요');
  }
  return store;
}

function words(article) {
  return new Set(article.sections.map(section => section.text).join(' ').replace(/[^가-힣a-zA-Z\s]/g, '').split(/\s+/).filter(word => word.length > 1));
}

export function publicationErrors(article, store, {exists = image => fs.existsSync(path.join(process.cwd(), 'public', image))} = {}) {
  const errors = [];
  if (!article.reviewed) errors.push('본문 편집 검토 필요');
  if (!Number.isFinite(Date.parse(article.publishAt))) errors.push('발행 시각 필요');
  if (article.sections.length < 2 || article.sections.map(section => section.text).join('').length < 350) errors.push('미완성 본문');
  const images = [article.cover, ...article.sections.map(section => section.image).filter(Boolean)];
  if (images.length < 3) errors.push('썸네일 포함 이미지 최소 3장 필요');
  if (images.length > 4) errors.push('썸네일 포함 이미지 최대 4장 초과');
  if (new Set(images.map(image => image.url)).size !== images.length) errors.push('같은 이미지 반복 사용');
  for (const image of images) if (!safeImage(image.url) || !exists(image.url) || !image.reviewed || !image.alt || image.width <= 0 || image.height <= 0 || (image.generated && !image.prompt)) errors.push('이미지 파일·설명·생성기록·검토 미완료');
  const ownWords = words(article);
  for (const other of store.articles.filter(item => item.slug !== article.slug)) {
    const otherWords = words(other);
    const overlap = [...ownWords].filter(word => otherWords.has(word)).length;
    if (article.title === other.title || (ownWords.size > 20 && overlap / Math.min(ownWords.size, otherWords.size) > .8)) errors.push('다른 글과 제목 또는 내용 중복');
  }
  return [...new Set(errors)];
}
