import themes from '@/data/programme-theme-media.json';
import reviews from '@/data/programme-image-reviews.json';
import {experienceEditorial,classEditorial} from './programmeEditorial.mjs';
import type {Experience} from './experienceData';
import type {LearningClass} from './publicDiscovery';
export type ProgrammeCoverData={src:string;alt:string;kind:'poster'|'photo'|'topic';heading:string;credit:string;source:string;fallbackSrc:string;fallbackCredit:string;fallbackSource:string};
export function programmeCover(item:Experience|LearningClass):ProgrammeCoverData{
 const experience='kind' in item?item as Experience:undefined,editorial=experience?experienceEditorial(experience):classEditorial(item);
 const images=themes.images as Record<string,typeof themes.images.general>;
 const category=({strawberry:'nature',harvest:'nature',coding:'digital',mentoring:'reading',language:'reading',history:'art',dance:'music',culture:'art',volunteer:'nature'} as Record<string,string>)[editorial.topicId]||editorial.topicId;
 const topic=images[category]||images.general,actual=experience?.image,review=(reviews.byHash as Record<string,{kind:string}>)[actual?.fileHash||''],quality=actual&&actual.width>=400&&actual.height>=250&&review?.kind!=='topic';
 const officialName=experience?.title||editorial.officialName,heading=officialName.length>45?editorial.focus:officialName;
 const topicCredit=`주제 이미지: ${topic.title} · ${topic.provider}/${topic.photographer}`;
 return {src:quality?actual.src:topic.src,alt:quality?experience!.imageAlt:`${editorial.focus} 안내용 주제 이미지 (${topic.title})`,kind:quality?review?.kind==='photo'?'photo':experience?.imageKind==='poster'?'poster':'photo':'topic',heading,credit:quality?experience!.imageAlt:topicCredit,source:quality?experience!.imageSourcePage||actual.source:topic.sourcePage,fallbackSrc:topic.src,fallbackCredit:topicCredit,fallbackSource:topic.sourcePage};
}
