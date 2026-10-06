import fs from 'node:fs';
import path from 'node:path';
import {currentProducts} from './sharelink-policy.mjs';
export type TossProduct={id:number;topic:string;headline:string;reason:string;caution:string;name:string;image:string;imageNote?:string;option?:string;price:number;discountRate?:number;links:Record<string,string>;endAt?:string};
export type TossFeed={version:number;checkedAt:string;products:TossProduct[]};
export function readTossFeed():TossFeed {
 try {
  const file=process.env.TOSS_SHARELINK_PUBLIC_FILE||path.join(process.cwd(),'data/sharelink-editorial.json');
  const feed=JSON.parse(fs.readFileSync(file,'utf8')) as TossFeed;
  if(feed.version!==1||!Array.isArray(feed.products)||!Number.isFinite(Date.parse(feed.checkedAt)))throw new Error('invalid');
  return {version:1,checkedAt:feed.checkedAt,products:currentProducts(feed).filter(p=>Number.isInteger(p.id)&&p.name&&p.image?.startsWith('https://')&&Number.isFinite(p.price)&&p.price>=0&&p.links&&Object.values(p.links).every(l=>l.startsWith('https://')))};
 }catch{return {version:1,checkedAt:'',products:[]};}
}
