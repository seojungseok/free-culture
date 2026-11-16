import Link from 'next/link';
import {getPlaygroundCandidates,guideForFacility,playgroundAreas,playgroundCheckedAt,playgroundDate,playgroundMap} from '@/lib/playgroundData';
import {PLAYGROUND_SOURCE} from '@/lib/playgrounds.mjs';
import styles from './Playgrounds.module.css';
type Query=Record<string,string|string[]|undefined>;
const value=(query:Query,key:string)=>typeof query[key]==='string'?String(query[key]):'';
export default function PlaygroundRegistry({query}:{query:Query}){
 const all=getPlaygroundCandidates(),open=value(query,'view')==='registry'||value(query,'water')==='1'||Boolean(value(query,'page'));
 const area=playgroundAreas.includes(value(query,'area'))?value(query,'area'):'',q=(value(query,'registry_q')||(open?value(query,'q'):'' )).trim().slice(0,80),indoor=value(query,'registry_indoor')==='1'||value(query,'indoor')==='1',water=value(query,'water')==='1';
 const filtered=all.filter(p=>(!area||p.area===area)&&(!indoor||p.indoorOutdoor==='실내')&&(!water||p.waterEquipment===true)&&(!q||(`${p.name} ${p.address}`).replace(/\s/g,'').includes(q.replace(/\s/g,''))));
 const pages=Math.max(1,Math.ceil(filtered.length/20)),page=Math.min(pages,Math.max(1,parseInt(value(query,'page'),10)||1)),rows=filtered.slice((page-1)*20,page*20);
 const href=(number:number)=>{const params=new URLSearchParams({view:'registry',page:String(number)});if(area)params.set('area',area);if(q)params.set('registry_q',q);if(indoor)params.set('registry_indoor','1');if(water)params.set('water','1');return '/playgrounds?'+params+'#registry';};
 return <details id="registry" className={styles.registry} open={open}>
  <summary>공공시설 등록자료에서 더 찾아보기 <span>{all.length.toLocaleString()}건</span></summary>
  <div className={styles.registryBody}><h2>공공 놀이시설 등록자료 조회</h2><p>아직 방문 안내글을 작성하지 않은 시설도 검색할 수 있습니다. 주소·시설 등록상태 중심의 자료이며, 요금과 일반 방문 가능 여부는 운영기관 확인이 필요합니다.</p><p className={styles.stamp}>행정안전부 시설정보 조회: <time dateTime={playgroundCheckedAt}>{playgroundDate(playgroundCheckedAt)}</time></p>
   <form className={styles.filters} action="/playgrounds#registry" method="get"><input type="hidden" name="view" value="registry"/><label>시설명·주소<input type="search" name="registry_q" defaultValue={q} maxLength={80} placeholder="공원명 또는 동네"/></label><label>지역<select name="area" defaultValue={area}><option value="">전국</option>{playgroundAreas.map(a=><option key={a}>{a}</option>)}</select></label><label>실내·전체<select name="registry_indoor" defaultValue={indoor?'1':''}><option value="">전체 시설</option><option value="1">실내 시설</option></select></label><label>물놀이기구<select name="water" defaultValue={water?'1':''}><option value="">전체 놀이터</option><option value="1">물놀이기구 포함</option></select></label><button type="submit">등록자료 검색</button></form>
   {water&&<p className={styles.filterNote}>물놀이기구가 등록된 시설입니다. 겨울 물놀이 개장을 뜻하지 않으며, 올해 개장일·가동시간은 운영기관에서 확인해야 합니다.</p>}
   <p className={styles.count}>{area||'전국'} 등록시설 {filtered.length.toLocaleString()}건<small>같은 공원에 여러 놀이시설이 있을 수 있습니다.</small></p>
   {rows.length?<div className={styles.list}>{rows.map(p=>{const guide=guideForFacility(p.id);return <article key={p.id} className={styles.facility}><h3>{p.name}</h3><p>{p.address}</p><div className={styles.tags}><span>{p.area} · {p.place}</span><span>{p.indoorOutdoor}</span>{p.waterEquipment&&<span data-water="true">물놀이기구 등록 · 개장 별도 확인</span>}</div>{guide?<Link href={'/playgrounds/'+guide.slug}>사진·요금·운영시간 보기 →</Link>:<p>운영시간·요금은 운영기관에서 확인해 주세요.</p>}<a href={playgroundMap(p.name,p.address)} target="_blank" rel="noopener noreferrer">네이버지도 열기 ↗</a></article>;})}</div>:<p className={styles.empty}>조건에 맞는 등록시설이 없습니다. 지역이나 검색어를 바꿔보세요.</p>}
   <nav className={styles.pagination} aria-label="등록자료 목록 페이지">{page>1&&<Link rel="prev" href={href(page-1)}>← 이전</Link>}<span>{page} / {pages}</span>{page<pages&&<Link rel="next" href={href(page+1)}>다음 →</Link>}</nav><p className={styles.source}>출처: <a href={PLAYGROUND_SOURCE} target="_blank" rel="noopener noreferrer">행정안전부 전국어린이놀이시설정보서비스</a> · 공공 소유·운영 등록시설 중 공원·하천·공공도서관 자료입니다. 학교·주택단지·민간시설·이용금지 시설은 목록에서 제외했습니다.</p>
  </div>
 </details>;
}
