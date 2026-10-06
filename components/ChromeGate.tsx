"use client";

import { usePathname } from "next/navigation";
import TossAffiliate from './TossAffiliate';
import TravelAffiliate from './TravelAffiliate';
import type {TossFeed} from '@/lib/sharelink';

// 게임 상세(/game/xxx)에서는 사이트 헤더·푸터를 숨겨 '게임 집중(포커스) 화면'으로 전환.
// 허브(/game)는 사이트 내비를 유지.
export default function ChromeGate({
  header,
  footer,
  floating,
  children,
  tossFeed,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  floating: React.ReactNode;
  children: React.ReactNode;
  tossFeed: TossFeed;
}) {
  const p = usePathname() || "/";
  const focus = /^\/game\/[^/]+/.test(p); // /game/roulette, /game/ladder ... = 집중 화면

  if (focus) {
    return <main className="w-full">{children}</main>;
  }
  return (
    <>
      {header}
      <main className="w-full"><TossAffiliate initial={tossFeed} position="top" />{children}<TossAffiliate initial={tossFeed} position="article" />{p!=='/'&&<TravelAffiliate />}</main>
      {footer}
      {floating}
    </>
  );
}
