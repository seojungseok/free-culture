import {isPlaygroundCandidate} from './playgrounds.mjs';
export function playgroundSeason(now=new Date()){
 const kst=new Date(now.getTime()+9*3600000),today=kst.toISOString().slice(0,10),month=kst.getUTCMonth()+1,day=kst.getUTCDay(),offset=day===0?0:day===6?0:6-day;
 const weekend=new Date(Date.UTC(kst.getUTCFullYear(),kst.getUTCMonth(),kst.getUTCDate()+offset)).toISOString().slice(0,10);
 return {today,winter:[11,12,1,2,3].includes(month),weekend};
}
export function isTemporarilyClosed(review,date){return (review?.exceptions||[]).some(p=>p.start<=date&&date<=p.end);}
export function canRecommendPlayground(guide,facilities,review,{now=new Date(),forDate}={}){
 const season=playgroundSeason(now),date=forDate||season.weekend;
 if(date<season.today)return false;
 const checked=Date.parse(review?.checkedAt);
 if(!review||review.status!=='verified'||!Number.isFinite(checked)||checked<now.getTime()-72*3600000||checked>now.getTime()+300000)return false;
 if((review.closedWeekdays||[]).includes(new Date(date+'T12:00:00Z').getUTCDay()))return false;
 if(!facilities.some(isPlaygroundCandidate)||isTemporarilyClosed(review,date))return false;
 if(season.winter&&!guide.indoor)return false;
 if(facilities.some(p=>p.waterEquipment)&&!(review.waterOpenIntervals||[]).some(p=>p.start<=date&&date<=p.end))return false;
 return true;
}
