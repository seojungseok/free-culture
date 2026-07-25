import type { ReactNode } from "react";

// 통제된 마크다운(우리 생성물) 전용 경량 렌더러 — ## 소제목 / - 목록 / **굵게** / 문단
function renderInline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-ink">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ArticleBody({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // 소제목 (## 또는 ###)
    if (/^#{2,3}\s/.test(line)) {
      blocks.push(
        <h2 key={key++} className="mt-7 text-[19px] font-extrabold tracking-tight text-ink first:mt-0 sm:text-[20px]">
          {renderInline(line.replace(/^#{2,3}\s/, ""))}
        </h2>
      );
      i++;
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
