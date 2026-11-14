import {readDataFreshness} from '@/lib/data-freshness.mjs';

const labels={fresh:'주기 내 수집',partial:'일부 갱신 보류',stale:'갱신 확인 필요',missing:'수집 기록 확인 필요'};
export default function DataFreshness() {
  const report=readDataFreshness();
  return <section id="data-updates" aria-labelledby="data-updates-title">
    <h2 id="data-updates-title">공공자료 최신화 현황</h2>
    <p>문화행사·축제·반려동물 정보·문화 강좌는 매일, 관광지·음식점·캠핑장 목록은 매주 갱신합니다. 이동·영유아 편의정보는 화~일요일에 확인합니다. 아래 시각은 한국시간 기준 마지막 목록 수집 기록이며, 모든 장소의 요금·운영시간을 그날 개별 확인했다는 뜻은 아닙니다.</p>
    <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">자료별 수집 주기와 마지막 목록 수집 시각</caption><thead><tr><th scope="col" className="p-2 text-left">자료</th><th scope="col" className="p-2 text-left">마지막 목록 수집</th><th scope="col" className="p-2 text-left">상태</th></tr></thead><tbody>{report.sources.map(source=><tr key={source.id} className="border-t"><th scope="row" className="p-2 text-left font-medium">{source.label}<span className="block text-xs font-normal text-neutral-500">{source.interval} · 저장 {source.count.toLocaleString('ko-KR')}건</span></th><td className="p-2">{source.checkedAt?<time dateTime={source.checkedAt}>{new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(source.checkedAt))}</time>:'미확인'}</td><td className="p-2">{labels[source.status]}</td></tr>)}</tbody></table></div>
    <p>제공기관 장애나 요청 한도에 걸리면 기존 정보를 보존하고 보류 상태를 표시합니다. 상세정보와 추가 사진은 오래된 확인 기록부터 차례로 보강하며, 실제 방문 전에는 운영처의 공식 안내를 확인하세요.</p>
  </section>;
}
