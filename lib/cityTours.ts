import data from '@/data/city-tour-articles.json';
export type CityLink={id:string;title:string;href:string;image:string;address:string};
export type CityArticle={heroPhoto?:{image:string;title:string;location:string;credit:string;sourceUrl:string;status:string}|null;id:string;title:string;description:string;intro:string;area:string;city:string;raw:Record<string,string>;sections:{heading:string;paragraphs:string[]}[];related:CityLink[];foodLinks:CityLink[];officialUrl:string;image:string;imageTitle:string;publishedAt:string;reviewed:boolean;priority:number};
export function getCityTours():CityArticle[]{return (data.articles as CityArticle[]).filter(a=>a.reviewed).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));}
export function getCityTour(id:string){return getCityTours().find(a=>a.id===id);}
export const CITY_SOURCE='https://www.data.go.kr/data/15025456/standard.do';
