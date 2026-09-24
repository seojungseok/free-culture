import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getTicket, getTickets, type TicketArticle} from '@/lib/tickets';
import TicketNearby from '@/components/TicketNearby';
import {SITE} from '@/lib/site';
import AdSlot from '@/components/AdSlot';

export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() { return getTickets().map(({slug}) => ({slug})); }

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const article = getTicket((await params).slug);
  if (!article) return {title: '방문 정보를 찾을 수 없습니다', robots: {index: false, follow: false}};
  return {
    title: article.title, description: article.description,
    robots: {index: article.indexable, follow: true},
    alternates: {canonical: `/tickets/${article.slug}`},
    openGraph: {title: article.title, description: article.description, type: 'article', images: [{url: article.thumbnail.url, alt: article.thumbnail.alt}]},
  };
}

function Photo({photo}: {photo: TicketArticle['thumbnail'] | TicketArticle['photos'][number]}) {
  const url = photo.url.startsWith(`${SITE.url}/`) ? photo.url.slice(SITE.url.length) : photo.url;
  return <figure className="my-6">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" className="h-auto w-full rounded-xl object-contain" />
    <figcaption className="mt-2 text-xs leading-5 text-ink-soft">{photo.credit}{'caption' in photo && photo.caption ? ` · ${photo.caption}` : ''}</figcaption>
  </figure>;
}

export default async function TicketPage({params}: {params: Promise<{slug: string}>}) {
  const article = getTicket((await params).slug);
  if (!article) notFound();
  const introRepeated = article.sections.some(section => section.paragraphs.some(paragraph => paragraph.replace(/\s+/g, ' ').trim() === article.intro.replace(/\s+/g, ' ').trim()));
  const url = `${SITE.url}/tickets/${article.slug}`;
  const jsonLd = [
    {'@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.description,
      image: [article.thumbnail.url], datePublished: article.publishedAt, dateModified: article.checkedAt,
      mainEntityOfPage: url, author: {'@type': 'Organization', name: SITE.name}},
    {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      {'@type': 'ListItem', position: 1, name: '홈', item: SITE.url},
      {'@type': 'ListItem', position: 2, name: '체험 장소', item: `${SITE.url}/tickets`},
      {'@type': 'ListItem', position: 3, name: article.placeName, item: url},
    ]},
  ];
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}} />
    <nav className="text-sm text-ink-soft"><Link href="/">홈</Link> / <Link href="/tickets">체험 장소</Link></nav>
    <p className="mt-6 text-sm font-bold text-free">{article.area} · {article.theme}</p>
    <h1 className="mt-2 break-keep text-3xl font-black leading-tight sm:text-4xl">{article.title}</h1>
    {article.indexable && <AdSlot label="본문 상단 광고" />}
    <p className="mt-3 text-sm text-ink-soft">정보 확인 {article.checkedAt.slice(0, 10)}</p>
    <Photo photo={article.thumbnail} />
    {article.intro && !introRepeated && <p className="text-base leading-8 text-ink-soft">{article.intro}</p>}
    {article.address && <p className="mt-4 text-sm leading-7"><strong>주소</strong> {article.address}</p>}
    {article.visitInfo.length > 0 && <section className="mt-9"><h2 className="text-xl font-bold">방문 정보</h2><dl className="mt-4 divide-y divide-line rounded-xl border border-line">{article.visitInfo.map((fact) => <div key={fact.topic} className="p-4"><dt className="font-bold">{fact.topic}</dt><dd className="mt-1 leading-7 text-ink-soft">{fact.value}</dd></div>)}</dl></section>}
    {article.indexable && <AdSlot label="본문 중간 광고" />}
    {article.sections.map((section) => <section key={section.heading} className="mt-9"><h2 className="text-xl font-bold">{section.heading}</h2>{section.paragraphs.map((paragraph, index) => <p key={index} className="mt-3 leading-8 text-ink-soft">{paragraph}</p>)}</section>)}
    {article.photos.slice(0, 3).map((photo) => <Photo key={photo.url} photo={photo} />)}
    {article.faq.length > 0 && <section className="mt-9"><h2 className="text-xl font-bold">자주 묻는 질문</h2>{article.faq.map((item) => <div key={item.question} className="mt-5"><h3 className="font-bold">{item.question}</h3><p className="mt-2 leading-7 text-ink-soft">{item.answer}</p></div>)}</section>}
    <TicketNearby article={article} />
    {article.internalLinks.length > 0 && <nav className="mt-9"><h2 className="text-lg font-bold">함께 둘러보기</h2><div className="mt-3 flex flex-wrap gap-3">{article.internalLinks.map((link) => <Link key={link.href} href={link.href} className="text-sm font-bold text-free underline">{link.label}</Link>)}</div></nav>}
    {article.sources.length > 0 && <details className="my-9 border-t border-line pt-5 text-sm text-ink-soft"><summary className="cursor-pointer font-bold">확인한 자료와 출처</summary><ul className="mt-3 space-y-2">{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">{source.label}</a> · {source.checkedAt.slice(0, 10)}</li>)}</ul></details>}
    {article.indexable && <AdSlot label="본문 하단 광고" />}
  </main>;
}
