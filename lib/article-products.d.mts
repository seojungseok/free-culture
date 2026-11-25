import type {TossFeed} from './sharelink';
export function isShoppingArticle(path:string):boolean;
export function selectArticleProducts(feed:TossFeed,now:number,path:string,title?:string):{id:number;name:string;href:string;image:string;price:number|null;unitPrice?:string;endAt?:string;discount?:number;topic:string;guide:boolean}[];
