import {normalizeAffiliateEvent} from './affiliate-events.mjs';

export function affiliateTrack(event:string,provider:string,placement:string,page:string,productId?:number){
 if(typeof window==='undefined')return;
 const payload=normalizeAffiliateEvent({event,provider,placement,page,...(productId!=null?{productId}: {})});
 if(!payload)return;
 const body=JSON.stringify(payload);
 let queued=false;
 try{queued=navigator.sendBeacon?.('/api/affiliate/events',new Blob([body],{type:'application/json'}))||false;}catch{}
 if(!queued)void fetch('/api/affiliate/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
 try{(window as Window&{gtag?:(...args:unknown[])=>void}).gtag?.('event',event,{affiliate_provider:provider,placement,page_path:page,...(productId?{product_id:String(productId)}:{})});}catch{}
}
