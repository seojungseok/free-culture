import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAllEvents, getEventById } from '@/lib/data';
import archivedEventsData from '@/data/events-archive.json';
import type { CultureEvent } from '@/lib/types';
import { todayYmd } from '@/lib/dates';
import { dday } from '@/lib/format';
import { eventContentsParagraphs, eventContentsText } from '@/lib/eventContents';
import { cultureGuide, eventStartIso, publicEventLink } from '@/lib/cultureGuide';
import { withSearchMetadata } from '@/lib/searchMetadata';
import { eventOffer } from '@/lib/eventSeo';
import { hasSubstantiveEventInfo } from '@/lib/eventQuality';
import { isEventPublished } from '@/lib/event-publication.mjs';
import { displayAddress, displayRegionTitle } from '@/lib/address';
import { SIDO_SLUG } from '@/lib/classify';
import { SITE } from '@/lib/site';
import TossTopDeals from '@/components/TossTopDeals';
import PriceBadge from '@/components/PriceBadge';
import PosterCard from '@/components/PosterCard';
import ShareButtons from '@/components/ShareButtons';
import NextStop from '@/components/NextStop';
import NearbyParking from '@/components/NearbyParking';
import styles from './event.module.css';

const archivedEvents = new Map((archivedEventsData.events as CultureEvent[]).map(event => [event.id, {
  ...event,
  title: displayRegionTitle(event.title, event.area),
  address: displayAddress(event.address || '', event.area),
  addressConflict: Boolean(event.address && !displayAddress(event.address, event.area)),
}]));
const eventForDetail = (id: string) => {
  const event = getEventById(id) || archivedEvents.get(id);
  return event && isEventPublished(event) ? event : undefined;
};

export const revalidate = 10800;
export function generateStaticParams() {
  return getAllEvents().filter(event => event.featured).slice(0, 60).map(event => ({ id: event.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const event = eventForDetail((await params).id);
  if (!event) notFound();
  const guide = cultureGuide(event);
  return withSearchMetadata({
    title: guide.title,
    description: guide.description,
    robots: event.endDate < todayYmd() || !hasSubstantiveEventInfo(event) ? { index: false, follow: true } : undefined,
    alternates: { canonical: `/event/${event.id}` },
    openGraph: {
      title: guide.title, description: guide.description, url: `/event/${event.id}`, type: 'article',
      images: event.imgUrl ? [{ url: event.imgUrl, alt: event.posterAlt || `${event.title} 공식 포스터` }] : undefined,
    },
  });
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const ev = eventForDetail((await params).id);
  if (!ev) notFound();
  const today = todayYmd();
  const ended = ev.endDate < today;
  const guide = cultureGuide(ev);
  const countdown = dday(ev.startDate, ev.endDate, today);
  const regionSlug = (SIDO_SLUG as Record<string, string>)[ev.area];
  const canLocate = !ev.addressConflict && Number(ev.gpsX) > 0 && Number(ev.gpsY) > 0;
  const mapUrl = !ev.addressConflict && (ev.address || ev.place)
    ? `https://map.naver.com/p/search/${encodeURIComponent([ev.place, ev.address].filter(Boolean).join(' '))}` : '';
  const contents = eventContentsParagraphs(ev.contents);
  const additionalFacts = guide.facts.filter(fact => !/^(행사시간|공연시간|소요시간|관람연령|관람등급|주최)$/.test(fact.label) && fact.value !== guide.age && fact.value !== guide.time && fact.value !== guide.duration);
  const related = getAllEvents().filter(event => event.id !== ev.id && event.area === ev.area && event.imgUrl && event.endDate >= today)
    .sort((a, b) => Number(b.genreKey === ev.genreKey) - Number(a.genreKey === ev.genreKey) || a.endDate.localeCompare(b.endDate)).slice(0, 6);
  const sourceDescription = eventContentsText(ev.contents) || guide.detail?.programme?.join(' · ') || [ev.title, guide.visit].filter(Boolean).join('. ');
  const startDate = eventStartIso(ev, guide.time);
  const eventJson = {
    '@context': 'https://schema.org', '@type': 'Event', name: ev.title, url: `${SITE.url}/event/${ev.id}`,
    startDate, endDate: ev.endAt || (startDate?.includes('T') ? undefined : iso(ev.endDate)),
    isAccessibleForFree: ev.priceType === 'free' ? true : undefined,
    organizer: guide.organizer ? { '@type': 'Organization', name: guide.organizer, url: publicEventLink(ev.organizerUrl) || undefined } : undefined,
    eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: ev.imgUrl ? [new URL(ev.imgUrl, SITE.url).href] : undefined, description: sourceDescription,
    location: { '@type': 'Place', name: ev.place || '장소 확인 필요',
      ...(!ev.addressConflict && ev.address ? { address: { '@type': 'PostalAddress', streetAddress: ev.address, addressRegion: ev.area, addressLocality: ev.sigungu || undefined, addressCountry: 'KR' } } : {}),
      ...(canLocate ? {geo:{'@type':'GeoCoordinates',longitude:Number(ev.gpsX),latitude:Number(ev.gpsY)}} : {}),
    },
    offers: ended ? undefined : eventOffer(ev),
  };
  const breadcrumb = [
    {name:'홈',item:SITE.url}, {name:'문화행사',item:`${SITE.url}/events`},
    {name:ev.realmName || '분야별 행사',item:`${SITE.url}/genre/${ev.genreKey}`}, {name:ev.title,item:`${SITE.url}/event/${ev.id}`},
  ];

  return <article className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify([eventJson,{
      '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:breadcrumb.map((item,index)=>({'@type':'ListItem',position:index+1,...item})),
    }]).replace(/</g,'\\u003c')}} />
    <nav aria-label="현재 위치" className={styles.breadcrumb}>
      <Link href="/">홈</Link><span aria-hidden="true">/</span><Link href="/events">문화행사</Link><span aria-hidden="true">/</span><Link href={`/genre/${ev.genreKey}`}>{ev.realmName || '분야별 행사'}</Link>
      <span className="sr-only"> / {ev.title}</span>
    </nav>

    <div className={styles.hero}>
      <header className={styles.summary} id="event-essential-info">
        <div className={styles.badges}>
          <Link href={`/genre/${ev.genreKey}`}>{ev.realmName || '문화행사'}</Link>
          {guide.region && regionSlug && <Link href={`/region/${regionSlug}`}>{guide.region}</Link>}
          <span>{ended ? '종료된 행사' : countdown?.label || '일정 확인'}</span>
        </div>
        <h1>{ev.seoTitle || ev.title}</h1>
        <p className={styles.lead}>{guide.summary}</p>
        {ended && <p className={styles.notice}>등록된 일정 기준으로 종료된 행사입니다. 아래 내용은 당시 안내입니다. <Link href={regionSlug ? `/region/${regionSlug}` : '/events'}>현재 열리는 행사 보기 →</Link></p>}
        <dl className={styles.facts}>
          <Row label="일정"><time dateTime={iso(ev.startDate)}>{guide.period}</time></Row>
          <Row label="시간">{guide.time || '세부 시간·회차는 공식 안내에서 확인'}</Row>
          <Row label={ended ? '당시 요금' : '관람료'}><strong>{guide.price}</strong>{ev.priceType === 'partial_free' && ev.freeCondition && <span className={styles.condition}>무료 적용 조건: {ev.freeCondition}</span>}</Row>
          <Row label="장소">{ev.place || '공식 안내에서 확인'}</Row>
          {!ev.addressConflict && ev.address && <Row label="주소" full>{ev.address}</Row>}
          {guide.age && <Row label="대상">{guide.age}</Row>}
          {guide.duration && <Row label="소요시간">{guide.duration}</Row>}
          {guide.organizer && <Row label="주최">{guide.organizer}</Row>}
          {ev.phone && <Row label="문의" full>{ev.phone}</Row>}
        </dl>
        <div className={styles.actions}>
          {guide.official && <a href={guide.official} target="_blank" rel="noopener noreferrer" className={styles.primary}>{ended ? '당시 공식 안내' : '공식 관람·신청 안내'} <span aria-hidden="true">↗</span></a>}
          {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer">지도·길찾기 <span aria-hidden="true">↗</span></a>}
        </div>
        {!ended && <p className={styles.bookingNote}>신청 가능 여부·잔여 좌석·초대권 수령 방법은 공식 안내에서 확인해 주세요.</p>}
      </header>

      {/* This full-width row stays beside the essential information in the flow. */}
      <div className={styles.advertisement} data-nosnippet=""><TossTopDeals contained compact /></div>

      <figure className={styles.poster}>
        <div className={styles.posterImage}>
          {ev.imgUrl ? <a href={ev.imgUrl} target="_blank" rel="noopener noreferrer" aria-label={`${ev.title} 포스터 크게 보기 (새 창)`}>
            <Image src={ev.imgUrl} alt={ev.posterAlt || `${ev.title} 공식 포스터`} fill sizes="(max-width:767px) 320px, 280px" className="object-contain" priority unoptimized />
          </a> : <p>{ev.title}<br />포스터가 제공되지 않았습니다.</p>}
          {!ended && <div className={styles.priceBadge}><PriceBadge type={ev.priceType} label={ev.priceLabel}/></div>}
        </div>
        {ev.imgUrl && <figcaption>주최 측 안내 포스터 · 이미지를 누르면 크게 볼 수 있습니다.</figcaption>}
      </figure>

    </div>

    <div className={styles.body}>
      <nav aria-label="행사 상세 바로가기" className={styles.contentsNav}>
        <a href="#event-guide">관람·신청</a>
        {(ev.sections?.length || contents.length || guide.detail?.programme?.length) ? <a href="#event-programme">소개·프로그램</a> : null}
        {canLocate && <a href="#event-location">장소·주변</a>}
        <a href="#event-questions">자주 묻는 질문</a><a href="#event-sources">출처</a>
      </nav>

      <section id="event-guide" className={styles.section} aria-labelledby="event-guide-title">
        <p className={styles.eyebrow}>BEFORE YOU GO</p>
        <h2 id="event-guide-title">관람·참여 전에 확인하세요</h2>
        {guide.visit && <p>{guide.visit}</p>}
        {!!additionalFacts.length && <dl className={styles.detailFacts}>{additionalFacts.map(fact=><Row key={fact.label} label={fact.label}>{fact.value}{fact.sourceUrl && <a className={styles.sourceLink} href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${fact.label} 공식 출처 (새 창)`}>출처 ↗</a>}</Row>)}</dl>}
        <ul className={styles.checks}>
          {ev.priceType === 'free' ? <li>무료로 안내된 행사입니다. 초대권 배부 방식과 사전 신청 여부를 확인한 뒤 방문하세요.</li> : ev.priceType === 'partial_free' ? <li>일부 대상·조건에 무료 혜택이 적용됩니다. 본인에게 적용되는 요금과 증빙 조건을 확인하세요.</li> : <li>좌석·회차·대상에 따라 요금이 달라질 수 있습니다. 선택할 관람 조건을 공식 안내와 대조하세요.</li>}
          {!guide.age && <li>관람연령 안내를 확보하지 못했습니다. 어린이와 동반한다면 공식 안내 또는 문의처에서 입장 기준을 확인하세요.</li>}
          {!guide.booking.length && <li>사전 신청 방법과 접수 마감 여부를 확인해 주세요. 행사 기간과 예약 가능한 기간은 다를 수 있습니다.</li>}
          <li>{guide.time ? '안내된 시간과 선택한 회차를 확인하고 이동 일정을 정하세요.' : '출발 전에 세부 시간과 휴관·회차별 운영 여부를 확인하세요.'}</li>
        </ul>
      </section>

      {(ev.sections?.length || contents.length || guide.detail?.programme?.length) ? <div id="event-programme">
        {ev.sections?.length ? ev.sections.map((section,index)=><section key={section.heading} className={styles.section} aria-labelledby={`event-editorial-${index}`}>
          <h2 id={`event-editorial-${index}`}>{section.heading}</h2>{eventContentsParagraphs(section.body).map((paragraph,i)=><p key={i} className={styles.sourceParagraph}>{paragraph}</p>)}
        </section>) : contents.length ? <section className={styles.section} aria-labelledby="event-programme-title"><h2 id="event-programme-title">행사 소개·상세 안내</h2>{contents.map((paragraph,index)=><p key={index} className={styles.sourceParagraph}>{paragraph}</p>)}</section> : null}
        {!!guide.detail?.programme?.length && <section className={styles.section} aria-labelledby="event-official-programme-title"><h2 id="event-official-programme-title">공식 안내에 실린 프로그램</h2><ul className={styles.programme}>{guide.detail.programme.map(item=><li key={item}>{item}</li>)}</ul><p className={styles.small}>프로그램은 주최 측 사정에 따라 변경될 수 있습니다. 전체 곡목·출연 정보는 공식 안내를 확인하세요.</p></section>}
      </div> : null}

      {!!ev.gallery?.length && <section className={styles.section} aria-labelledby="event-gallery-title"><h2 id="event-gallery-title">공식 안내 이미지</h2><div className={styles.gallery}>{ev.gallery.map(photo=><figure key={photo.src}>
        <img src={photo.src} alt={photo.alt} width={600} height={600} loading="lazy" decoding="async"/>
        <figcaption>{photo.caption} <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">공식 출처 ↗</a></figcaption>
      </figure>)}</div></section>}

      {!ended && canLocate && <section id="event-location" className={styles.location} aria-label="행사 장소와 주변 정보">
        <h2>행사장 위치와 함께 둘러볼 곳</h2><p>{ev.place} · {ev.address}</p>
        {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>지도에서 위치·길찾기 확인 ↗</a>}
        <NearbyParking lon={Number(ev.gpsX)} lat={Number(ev.gpsY)} area={ev.area} address={ev.address} title="행사장 근처 주차 확인"/>
        <NextStop anchor={{id:`event:${ev.id}`,title:ev.title,href:`/event/${ev.id}`,area:ev.area,kind:'event',image:ev.imgUrl,address:ev.address||ev.place,x:Number(ev.gpsX),y:Number(ev.gpsY),free:ev.priceType==='free',kids:ev.audiences?.includes('kids'),start:ev.startDate,end:ev.endDate}}/>
      </section>}

      <section id="event-questions" className={styles.section} aria-labelledby="event-questions-title"><h2 id="event-questions-title">자주 묻는 질문</h2><dl className={styles.questions}>{guide.faq.map(item=><div key={item.question}><dt>{item.question}</dt><dd>{item.answer}</dd></div>)}</dl></section>

      <section id="event-sources" className={styles.sources} aria-labelledby="event-sources-title">
        <h2 id="event-sources-title">정보 출처와 확인 안내</h2>
        <p>{ev.sourceLabel || '공공데이터포털 · 한국문화정보원'}의 행사 정보와 공식 안내를 바탕으로 정리했습니다.</p>
        {guide.sources.length > 0 ? <ul>{guide.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{new URL(source.url).hostname.includes('culture.go.kr') ? '문화포털 행사 상세' : '행사 공식 안내'} ↗</a><span> 확인 <time dateTime={source.checkedAt}>{new Date(source.checkedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</time></span></li>)}</ul> : guide.official && <p><a href={guide.official} target="_blank" rel="noopener noreferrer">행사 공식 안내 확인 ↗</a></p>}
        {guide.detail?.excerpt && <blockquote>{guide.detail.excerpt}</blockquote>}
        {publicEventLink(ev.instagramUrl) && <p><a href={publicEventLink(ev.instagramUrl)} target="_blank" rel="noopener noreferrer">주최 측 인스타그램 ↗</a></p>}
        <p>일정·요금·프로그램은 변경될 수 있습니다. 최신 참여 조건은 공식 안내를 우선 확인하세요.</p>
        <ShareButtons title={ev.title} officialUrl={guide.official}/>
        <p className={styles.small}>잘못된 정보가 있나요? <a href={`mailto:${SITE.email}?subject=${encodeURIComponent(`문화행사 정보 제보 - ${ev.title}`)}`}>정보 수정 제보</a></p>
      </section>
    </div>

    {related.length > 0 && <section className={styles.related} aria-labelledby="event-related-title"><h2 id="event-related-title">{ev.area}에서 이어서 볼 문화행사</h2><div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">{related.map(event=><PosterCard key={event.id} ev={event}/>)}</div></section>}
    <nav className={styles.more} aria-label="다른 문화행사 찾아보기"><Link href={`/genre/${ev.genreKey}`}>{ev.realmName} 전체 보기 →</Link>{regionSlug && <Link href={`/region/${regionSlug}`}>{ev.area} 행사·나들이 →</Link>}<Link href="/free">무료 문화행사 →</Link><Link href="/weekend">이번 주말 가볼 곳 →</Link></nav>
  </article>;
}

function Row({label,children,full=false}:{label:string;children:ReactNode;full?:boolean}) {
  return <div className={`${styles.factRow} ${full?styles.fullFact:''}`} data-label={label}><dt>{label}</dt><dd>{children}</dd></div>;
}
function iso(value:string):string|undefined {
  return /^\d{8}$/.test(value)?`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`:undefined;
}
