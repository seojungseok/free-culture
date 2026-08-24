import Image from "next/image";
import type { ReactNode } from "react";
import type { CourseStop } from "@/lib/courses";

// 코스 블로그 렌더러 — 각 "## N. 스팟명" 소제목 뒤에 그 장소 사진을 끼워 본문을 풍부하게.
function renderInline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-ink">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/**
 * "한눈에 보는 코스" 항목 파싱.
 *  실제 생성물 형태(3가지 모두 대응):
 *   "**국형사** — 원주시 행구동에 있는 첫 방문지"
 *   "**1일차 오륙도 (부산 국가지질공원)** — 화산암 섬과 해안지질탐방로"
 *   "**1일차 ┃ 국형사** — 치악산 인근 천년 고찰"
 */
function parseStep(raw: string): { day: string; name: string; desc: string } {
  const m = raw.match(/^\*\*(.+?)\*\*\s*(?:[—–-]\s*)?(.*)$/);
  const plain = raw.replace(/\*\*/g, "");
  let head = m ? m[1].trim() : plain.split(/\s[—–-]\s/)[0].trim();
  const desc = (m ? m[2] : plain.split(/\s[—–-]\s/).slice(1).join(" — ")).trim();
  const d = head.match(/^(\d+\s*일차)\s*[┃|:·\-]?\s*(.*)$/);
  const day = d ? d[1].replace(/\s+/g, "") : "";
  if (d) head = d[2].trim();
  return { day, name: head, desc };
}

/**
 * 번호 목록 = 코스 경로 요약. 모바일에서 한 문단으로 뭉쳐 읽기 힘들던 부분.
 *  → 항목마다 한 줄씩, 번호 뱃지 + 일차 칩 + 장소명(굵게) + 설명(줄바꿈)으로 끊어 준다.
 */
function StepList({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 space-y-2">
      {items.map((raw, j) => {
        const { day, name, desc } = parseStep(raw);
        return (
          <li key={j} className="flex gap-3 rounded-xl bg-panel px-3.5 py-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-free text-[12.5px] font-black text-white">
              {j + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                {day && (
                  <span className="rounded-md bg-free/10 px-1.5 py-0.5 text-[11.5px] font-bold text-free">{day}</span>
                )}
                <span className="text-[15px] font-extrabold text-ink">{name}</span>
              </span>
              {desc && (
                <span className="mt-1 block text-[13.5px] leading-[1.65] text-ink-soft">{renderInline(desc)}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StopImage({ stop }: { stop: CourseStop }) {
  if (!stop?.image) return null;
  return (
    <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/[0.04]">
      <Image src={stop.image} alt={stop.name} fill sizes="(max-width:820px) 100vw, 820px" className="object-cover" loading="lazy" unoptimized />
    </div>
  );
}

export default function CourseArticleBody({ content, stops }: { content: string; stops: CourseStop[] }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0, key = 0;

  const findStop = (headingText: string): CourseStop | undefined => {
    const m = headingText.match(/^(\d+)\.\s*(.+)$/);
    if (m) {
      const byNum = stops[Number(m[1]) - 1];
      const name = m[2].trim();
      // 번호 매칭 우선, 이름이 어긋나면 이름 포함으로 보정
      if (byNum && (byNum.name === name || headingText.includes(byNum.name) || byNum.name.includes(name))) return byNum;
      const byName = stops.find((s) => name.includes(s.name) || s.name.includes(name));
      return byName || byNum;
    }
    return stops.find((s) => headingText.includes(s.name));
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (/^#{2,3}\s/.test(line)) {
      const headingText = line.replace(/^#{2,3}\s/, "");
      const isDay = /^\d+\s*일차/.test(headingText);
      if (isDay) {
        // 일차 구분 — 눈에 띄는 밴드
        blocks.push(
          <h2 key={key++} className="mt-9 mb-1 inline-block rounded-full bg-free px-3.5 py-1.5 text-[15px] font-black text-white first:mt-0">
            {renderInline(headingText)}
          </h2>
        );
        i++;
        continue;
      }
      // 장소 소제목 + 사진
      blocks.push(
        <h3 key={key++} className="mt-6 text-[17px] font-extrabold tracking-tight text-ink sm:text-[18px]">
          {renderInline(headingText)}
        </h3>
      );
      i++;
      const stop = findStop(headingText);
      if (stop?.image) blocks.push(<StopImage key={key++} stop={stop} />);
      continue;
    }

    // 번호 목록 (1. 2. 3.) — 예전엔 처리하지 않아 문단으로 합쳐져 모바일에서 벽처럼 보였다.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, "").trim());
        i++;
      }
      blocks.push(<StepList key={key++} items={items} />);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++; }
      blocks.push(
        <ul key={key++} className="mt-3 space-y-1.5 rounded-xl bg-panel px-4 py-3">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2 text-[14px] leading-[1.7] text-ink-soft">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-free" />
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) { para.push(lines[i]); i++; }
    blocks.push(
      <p key={key++} className="mt-3 text-[15px] leading-[1.85] text-ink-soft">
        {renderInline(para.join(" "))}
      </p>
    );
  }

  return <div className="mt-5">{blocks}</div>;
}
