// Some public programme feeds replace decorative bullets with literal '?'.
// Only remove those markers; questions inside sentences and URL queries survive.
export function cleanExperienceText(value) {
  const original = String(value ?? '');
  const brokenBullet = /^\s*[?？\ufffd]/u.test(original);
  let line = original
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/^[\s?？\ufffd\ufe0e\ufe0f]+/u, '')
    .replace(/^([☎☏])\s*[?？\ufffd]+/u, '$1 ')
    .replace(/&(nbsp|amp|lt|gt|quot|apos|middot|bull|rarr|hellip);/g,(_,entity)=>({nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",middot:'·',bull:'•',rarr:'→',hellip:'…'})[entity])
    .replace(/\s+/g, ' ')
    .trim();
  if (brokenBullet) line = line.replace(/\s+[?？\ufffd]+\s+/gu, ' · ');
  return line;
}

const factLabels = new Set([
  '사업명', '프로그램명', '기간', '일시', '활동기간', '운영기간',
  '장소', '활동장소', '대상', '참가대상', '참여대상', '모집대상', '교육대상',
  '인원', '모집인원', '내용', '활동내용', '주요내용', '운영횟수',
  '신청방법', '접수방법', '신청기간', '접수기간', '준비물', '문의', '문의처', '주최/주관',
]);
const bullet = /^(?:[○●◦•․‣■□▪◆◇▶▷ㆍ·※]+\s*|[-*]\s+)/u;

export function experienceFact(value) {
  const line = cleanExperienceText(value).replace(bullet, '').replace(/^[☎☏]\s*/u, '');
  const match = line.match(/^([^:：]{1,24})\s*[:：]\s*(.+)$/u);
  if (!match) return null;
  const label = match[1].replace(/\s/g, '');
  return factLabels.has(label) ? [label, match[2].trim()] : null;
}

export function experienceContentBlocks(lines, list = false) {
  const blocks = [];
  const sourceLines = lines.flatMap(value=>String(value ?? '').split(/\r?\n/)).flatMap(value=>/^[•․‣]/u.test(value.trim())?value.split(/(?=[•․‣])/u):[value]);
  for (const value of sourceLines) {
    const line = cleanExperienceText(value);
    if (!line) continue;
    const fact = experienceFact(line);
    const type = fact ? 'facts' : list || bullet.test(line) ? 'list' : 'paragraph';
    const entry = fact || (type === 'list' ? line.replace(bullet, '') : line);
    const previous = blocks.at(-1);
    if (previous?.type === type && type !== 'paragraph') previous.items.push(entry);
    else if (type === 'paragraph' && line.length > 350) {
      for (const paragraph of line.split(/(?<=[.!?])\s+(?=[가-힣“‘"'])/u)) blocks.push({type, items:[paragraph]});
    } else blocks.push({type, items: [entry]});
  }
  return blocks;
}

export function experienceIntro(lines, maxLength = 180) {
  const content = experienceContentBlocks(lines).filter(block=>block.type!=='facts').flatMap(block=>block.items).join(' · ');
  return content.length > maxLength ? content.slice(0,maxLength-1).trimEnd()+'…' : content;
}
