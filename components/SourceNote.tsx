export default function SourceNote({ name, href, dates = [], officialUrl }: { name: string; href: string; dates?: { label: string; at?: string }[]; officialUrl?: string }) {
  const validDates = dates.filter(({ at }) => at && Number.isFinite(Date.parse(at)));
  return <aside className="mt-8 rounded-xl bg-panel px-4 py-3 text-[12px] leading-6 text-ink-faint" aria-label="정보 출처와 수집일">
    <p>정보 출처: <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{name}</a></p>
    {validDates.map(({ label, at }) => <p key={label}>{label}: <time dateTime={at}>{new Date(at!).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })}</time></p>)}
    <p>운영시간·요금·이용 조건은 변경될 수 있습니다.{officialUrl ? <> <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-free underline underline-offset-2">공식 홈페이지에서 최신 안내 확인</a></> : " 방문 전 운영처의 최신 안내를 확인해 주세요."}</p>
  </aside>;
}
