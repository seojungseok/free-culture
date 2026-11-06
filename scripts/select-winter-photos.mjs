import fs from 'node:fs';
import sharp from 'sharp';
const file='data/winter-daytrip-places.json',plans=JSON.parse(fs.readFileSync(file));
const extra=JSON.parse(fs.readFileSync('data/winter-api-extra.json'));
const gallery=JSON.parse(fs.readFileSync('data/photo-gallery.json'));
// Selected from full contact sheets, keeping the original image and attribution.
const alternatives={'126081':2,'2611140':1,'2675068':19,'1919548':8,'129784':1};
const gallerySelection={'126509':'918664','125555':'2620332','126730':'2620250'};
for(const plan of plans)for(const stop of plan.stops){
 const chosen=gallery.photos.find(x=>x.id===gallerySelection[stop.id]);
 const alternative=extra.images[stop.id]?.images[alternatives[stop.id]];
 if(!chosen&&!alternative)continue;
 const src=chosen?.image||alternative.originimgurl.replace(/^http:/,'https:');
 const r=await fetch(src,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Photo retrieval failed');
 const dest='public'+stop.photo.src;
 await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({width:1200,height:900,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(dest);
 const metadata=await sharp(dest).metadata();
 Object.assign(stop.photo,{sourceUrl:src,width:metadata.width,height:metadata.height,reviewed:false});
 if(chosen)Object.assign(stop.photo,{galleryId:chosen.id,sourceCheckedAt:gallery.generatedAt,credit:`한국관광공사 관광사진갤러리 · ${chosen.photographer}`,caption:`${chosen.title} · 자료 사진`,alt:chosen.title,sourceYear:chosen.month.slice(0,4)});
 console.log(plan.city,stop.id,chosen?.title||alternative.imgname);
}
fs.writeFileSync(file,JSON.stringify(plans,null,2)+'\n');
