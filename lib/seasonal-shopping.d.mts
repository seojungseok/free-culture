import type {TossFeed} from './sharelink';
type ReviewedProduct={id:number;name:string;image:string;price:number;label:string;checkedAt:string;links:{home?:string}};
export type SeasonalProduct={id:number;name:string;image:string;price:number;label:string;checkedAt:string;expiresAt:number;discountRate?:number;links:{home:string}};
export function selectSeasonalProducts(feed:TossFeed,collection:{productIds:number[]},reviewed:readonly ReviewedProduct[],now:number):SeasonalProduct[];
