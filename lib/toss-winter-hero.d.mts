import type {TossFeed,TossProduct} from './sharelink';
export function winterTossCampaign(product:TossProduct):{label:string;title:string;art?:string;productPrefix?:string}|null;
export function selectWinterTossHero(feed:TossFeed,now:number):(TossProduct&{verifiedAt:string;freshUntil:number})[];
