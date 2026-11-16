import fs from 'node:fs';
import path from 'node:path';
import editorial from '@/data/playground-guides.json';
import tourism from '@/data/playground-tour.json';
import {isPlaygroundCandidate} from './playgrounds.mjs';
import operationData from '@/data/playground-operations.json';
import {canRecommendPlayground,playgroundSeason,isTemporarilyClosed} from './playgroundSeason.mjs';
export {playgroundSeason,isTemporarilyClosed};
export {playgroundTopics,playgroundBrowseHref,filterPlaygroundGuides} from './playgroundContent.mjs';
export type Playground = {id:string;name:string;address:string;area:string;placeCode:string;place:string;ownership:string;operation:string;active:boolean;listed:boolean;indoorOutdoor:string;waterEquipment:boolean|null;latitude:number|null;longitude:number|null;checkedAt:string;source:string};
export type PlaygroundGuide = (typeof editorial.guides)[number];
type Snapshot = {generatedAt:string;refresh:{complete:boolean;candidates:number;checkedAt:string};records:Playground[]};
const snapshot:Snapshot = JSON.parse(fs.readFileSync(path.join(process.cwd(),'data','playgrounds.json'),'utf8'));
const byId=new Map(snapshot.records.map(p=>[p.id,p]));
const candidates=snapshot.records.filter(isPlaygroundCandidate);
export const playgroundAreas=['서울','경기','인천','강원','충북','충남','대전','세종','전북','전남','광주','경북','경남','대구','부산','울산','제주'];
export const playgroundCheckedAt=snapshot.refresh.checkedAt;
export function getPlaygroundCandidates(){return candidates;}
export function getPlaygroundGuides(){return editorial.guides;}
export function getPlaygroundGuide(slug:string){return editorial.guides.find(guide=>guide.slug===slug);}
export function getGuideFacilities(guide:PlaygroundGuide){return guide.facilityIds.map(id=>byId.get(id)).filter((p):p is Playground=>Boolean(p));}
type TourRecord={checkedAt:string;detailsCheckedAt?:string;photosCheckedAt?:string;contentType?:number;introChangedSinceReview?:boolean;detailsChangedSinceReview?:boolean;common?:{title:string;address:string;homepage:string;telephone:string;latitude:number|null;longitude:number|null};extra?:{name:string;content:string}[];intro:{usetime:string;parking:string;restdate?:string;infocenter?:string};photos:{src:string;alt:string;original:string;credit:string;license:string;contentId:string;originalSha256?:string}[]};
export function getGuideTour(guide:PlaygroundGuide){return (tourism.places as Record<string,TourRecord>)[guide.tourId];}
export function getOperationReview(guide:PlaygroundGuide){return (operationData.reviews as Record<string,{status:string;checkedAt?:string;exceptions:{start:string;end:string;label:string;source:string}[]}>)[guide.slug];}
export function getRecommendedPlaygroundGuides(now=new Date()){return editorial.guides.filter(guide=>canRecommendPlayground(guide,getGuideFacilities(guide),getOperationReview(guide),{now})&&!getGuideTour(guide).introChangedSinceReview&&!getGuideTour(guide).detailsChangedSinceReview);}
export function getGuideState(guide:PlaygroundGuide){return getGuideFacilities(guide).some(isPlaygroundCandidate);}
export function guideForFacility(id:string){return editorial.guides.find(g=>g.facilityIds.includes(id));}
export const guidePublishedAt=editorial.publishedAt;
export function guideModifiedAt(guide:PlaygroundGuide){return guide.updatedAt||guidePublishedAt;}
export function getGuideAddress(guide:PlaygroundGuide){return guide.visit.address||getGuideTour(guide).common?.address||getGuideFacilities(guide)[0]?.address||guide.area;}
export function playgroundDate(at:string){return new Date(at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});}
export function playgroundMap(name:string,address:string){return 'https://map.naver.com/p/search/'+encodeURIComponent(name+' '+address);}
