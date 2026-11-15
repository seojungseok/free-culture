import Image from './PrepStaticImage';
import type {PrepImage} from '@/lib/weekend-prep/types';

/** Every guide cover uses real HTML lettering, never text painted by image AI. */
export default function PrepCover({photo,label,priority=false,sizes='(max-width: 640px) 100vw, 800px'}:{photo:PrepImage;label:string;priority?:boolean;sizes?:string}){
 return <div className="prep-cover">
  <Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes={sizes} priority={priority} fetchPriority={priority?'high':undefined}/>
  {photo.generated&&<span className="prep-cover-ai">AI 연출</span>}
  <div className="prep-cover-caption">
   <span className="prep-cover-kicker">주말을 준비하는 시간</span>
   <strong className="prep-cover-title">{label}</strong>
  </div>
 </div>;
}
