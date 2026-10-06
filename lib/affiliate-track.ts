export function affiliateTrack(event:string,provider:string,placement:string,page:string,productId?:number){
 const payload={event,provider,placement,page,...(productId?{productId}: {})};
 const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
 if(!navigator.sendBeacon?.('/api/affiliate/events',blob))void fetch('/api/affiliate/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
 (window as Window&{gtag?:(...args:unknown[])=>void}).gtag?.('event',event,{affiliate_provider:provider,placement,page_path:page,...(productId?{product_id:String(productId)}:{})});
}
