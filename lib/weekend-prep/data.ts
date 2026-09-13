import data from '@/data/weekend-prep.json';
import type {PrepStore} from './types';
export const isPrepReview=process.env.NODE_ENV==='development'&&process.env.WEEKEND_PREP_LOCAL_REVIEW==='1';
export const prepStore = data as PrepStore;
export function getPrepArticles(){return prepStore.articles.filter(a=>isPrepReview || a.status==='published' && Date.parse(a.publishAt)<=Date.now());}
