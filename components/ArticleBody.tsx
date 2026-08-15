import Image from "next/image";
import type { ReactNode } from "react";

// 통제된 마크다운(우리 생성물) 전용 경량 렌더러 — ## 소제목 / - 목록 / **굵게** / 문단
// 소제목마다 그 장소 사진을 한 장씩 끼워 본문을 풍부하게(코스 글과 같은 방식).
function renderInline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-ink">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ArticleBody({
  content,
  images = [],
  title = "",
}: {
  content: string;
  /** 본문 소제목 뒤에 순서대로 끼울 사진 URL (대표사진은 보통 상단 갤러리에 쓰므로 제외하고 넘김) */
  images?: string[];
  /** 사진 alt에 쓸 장소명 */
  title?: string;
}) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  let imgAt = 0; // 다음에 끼울 사진 인덱스 (소진되면 더 안 넣음)

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // 소제목 (## 또는 ###)
    if (/^#{2,3}\s/.test(line)) {
      const headingText = line.replace(/^#{2,3}\s/, "");
      blocks.push(
        <h2 key={key++} className="mt-7 text-[19px] font-extrabold tracking-tight text-ink first:mt-0 sm:text-[20px]">
          {renderInline(headingText)}
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
              <span>{renderInline(it)}</span>
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
        {renderInline(para.join(" "))}
      </p>
    );
  }

  return <div className="mt-5">{blocks}</div>;
}
