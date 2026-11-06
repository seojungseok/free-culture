import type {TossFeed, TossProduct} from './sharelink';
export const topDealGroups: {id:'all'|'snack'|'meal';label:string}[];
export function selectTopDeals(feed: TossFeed, now: number, options?: {isHome?:boolean}): TossProduct[];
export function topDealGroup(product: TossProduct): 'snack'|'meal';
export function topDealPreparation(product: TossProduct): string;
export function topDealOption(product: TossProduct): string;
