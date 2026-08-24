import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// 통제된 마크다운(우리 생성물) 전용 경량 렌더러 — ## 소제목 / - 목록 / **굵게** / 문단
// 소제목마다 그 장소 사진을 한 장씩 끼워 본문을 풍부하게(코스 글과 같은 방식).
//
// 본문 내부 링크: 글에 등장하는 주변 맛집·나들이 장소·코스 이름을 그 페이지로 연결한다.
//  글이 "주변 정보"를 근거로 쓰이면서 실제 업소·장소명이 본문에 나오는데, 지금까지는 그냥 글자였다.
//  하단 카드까지 스크롤해야 이동할 수 있으니 대부분 그냥 이탈한다. 문장 안에서 바로 넘어가게 한다.
//  · 링크 후보는 "서빙 시점"에 계산된 실제 존재하는 페이지만 넘겨받는다(죽은 링크 불가).
//  · 같은 이름은 처음 한 번만 링크한다(과링크 방지).
export type BodyLink = { name: string; href: string };

class LinkPicker {
  private byName: Map<string, string>;
  private used = new Set<string>();
  private budget: number;
  constructor(links: BodyLink[], budget = 8) {
    this.byName = new Map(
      links.filter((l) => l.name && l.href).map((l) => [l.name.trim(), l.href])
    );
    this.budget = budget;
  }
  /** 이름이 정확히 일치하고 아직 안 쓴 경우에만 href 반환 */
  take(name: string): string | null {
    const k = name.trim();
    if (this.budget <= 0 || this.used.has(k)) return null;
    const href = this.byName.get(k);
    if (!href) return null;
    this.used.add(k);
    this.budget--;
    return href;
  }
  /** 문자열 안에서 링크 가능한 이름을 찾아 잘라낸다(긴 이름 우선) */
  names(): string[] {
    return [...this.byName.keys()]
      .filter((n) => !this.used.has(n))
      .sort((a, b) => b.length - a.length);
  }
  get hasAny() { return this.budget > 0 && this.byName.size > 0; }
}

const linkCls = "font-bold text-free underline decoration-free/35 underline-offset-2 hover:decoration-free";

/** 링크가 아닌 평문에서 장소명을 찾아 링크로 바꾼다 */
function linkifyPlain(text: string, picker: LinkPicker, keyBase: string): ReactNode[] {
  if (!picker.hasAny) return [text];
  const out: ReactNode[] = [];
  let rest = text;
  let guard = 0;
  while (rest && guard++ < 20) {
    let best: { name: string; at: number } | null = null;
    for (const name of picker.names()) {
      const at = rest.indexOf(name);
      if (at === -1) continue;
      if (!best || at < best.at || (at === best.at && name.length > best.name.length)) best = { name, at };
    }
    if (!best) break;
    const href = picker.take(best.name);
    if (!href) break;
    if (best.at > 0) out.push(rest.slice(0, best.at));
    out.push(
      <Link key={`${keyBase}-${out.length}`} href={href} className={linkCls}>
        {best.name}
      </Link>
    );
    rest = rest.slice(best.at + best.name.length);
  }
  if (rest) out.push(rest);
  return out.length ? out : [text];
}

function renderInline(s: string, picker: LinkPicker, keyBase = "i"): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      const href = picker.take(inner);
      return href ? (
        <Link key={i} href={href} className={linkCls}>{inner}</Link>
      ) : (
        <strong key={i} className="font-bold text-ink">{inner}</strong>
      );
    }
    return <span key={i}>{linkifyPlain(part, picker, `${keyBase}-${i}`)}</span>;
  });
}

export default function ArticleBody({
  content,
  images = [],
  title = "",
  links = [],
}: {
  content: string;
  /** 본문 소제목 뒤에 순서대로 끼울 사진 URL (대표사진은 보통 상단 갤러리에 쓰므로 제외하고 넘김) */
  images?: string[];
  /** 사진 alt에 쓸 장소명 */
  title?: string;
  /** 본문에서 링크로 바꿀 이름 → 경로. 서빙 시점에 실제 존재하는 페이지만 넘길 것 */
  links?: BodyLink[];
}) {
  const picker = new LinkPicker(links);
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  let imgAt = 0; // 다음에 끼울 사진 인덱스 (소진되면 더 안 넣음)

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // 소제목 (## 또는 ###) — 소제목은 링크하지 않는다(빈 picker로 렌더)
    if (/^#{2,3}\s/.test(line)) {
      const headingText = line.replace(/^#{2,3}\s/, "");
      blocks.push(
        <h2 key={key++} className="mt-7 text-[19px] font-extrabold tracking-tight text-ink first:mt-0 sm:text-[20px]">
          {renderInline(headingText, new LinkPicker([]), `h${key}`)}
        </h2>
      );
      i++;
      // 소제목 바로 뒤에 사진 한 장 — alt는 "장소명 소제목"(이미지 검색 노출)
      const src = images[imgAt];
      if (src) {
        imgAt++;
        // 소제목에 이미 장소명이 들어간 경우(SEO 소제목) 앞에 또 붙이지 않는다
        const plain = headingText.replace(/\*\*/g, "").trim();
        const alt = title && !plain.includes(title) ? `${title} ${plain}` : plain || title;
        blocks.push(
          <div key={key++} className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width:820px) 100vw, 820px"
              className="object-cover"
              loading="lazy"
              unoptimized
            />
          </div>
        );
      }
      continue;
    }

    // 목록
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="mt-3 space-y-1.5">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2 text-[15px] leading-[1.7] text-ink-soft">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-free" />
              <span>{renderInline(it, picker, `l${key}-${j}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 문단 (빈 줄/소제목/목록 전까지)
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|\s*[-*]\s)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="mt-3 text-[15px] leading-[1.85] text-ink-soft">
        {renderInline(para.join(" "), picker, `p${key}`)}
      </p>
    );
  }

  return <div className="mt-5">{blocks}</div>;
}
