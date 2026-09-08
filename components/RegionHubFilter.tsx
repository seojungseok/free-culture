'use client';
import {useEffect,useState,type ReactNode} from 'react';
type Panel={key:string;label:string;content:ReactNode};
export default function RegionHubFilter({panels,id='region-kind',label='종류별로 골라보기',compact=false}:{panels:Panel[];id?:string;label?:string;compact?:boolean}){
 const [active,setActive]=useState(panels[0]?.key || '');
 const current=panels.some(p=>p.key===active)?active:panels[0]?.key;
 useEffect(()=>{if(compact)return;const sync=()=>{const hash=window.location.hash.slice(1);if(panels.some(p=>p.key===hash))setActive(hash);};sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[panels,compact]);
 if(!panels.length)return null;
 function choose(key:string){setActive(key);if(!compact)window.history.replaceState(null,'',window.location.pathname+window.location.search+'#'+key);}
 return <div className="mt-6">
 {compact?<label className="mb-5 flex flex-wrap items-center gap-3 text-sm font-bold" htmlFor={id}>{label}<select id={id} value={current} onChange={e=>choose(e.target.value)} className="min-h-11 max-w-full rounded-xl border border-line bg-white px-3 font-normal">{panels.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}</select></label>:<><p className="mb-3 text-sm font-bold">{label}</p><div role="group" aria-label={label} className="mb-5 flex flex-wrap gap-2">{panels.map(p=><button type="button" key={p.key} aria-pressed={current===p.key} aria-controls={`${id}-${p.key}`} onClick={()=>choose(p.key)} className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold ${current===p.key?'bg-brandblue text-white':'border border-line bg-white text-ink-soft hover:bg-slate-50'}`}>{p.label}</button>)}</div></>}
 {panels.map(p=><div key={p.key} id={`${id}-${p.key}`} hidden={current!==p.key}>{p.content}</div>)}
 </div>;
}
