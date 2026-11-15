import Image from './PrepStaticImage';
import PrepCover from './PrepCover';
import type {PrepImage as Photo} from '@/lib/weekend-prep/types';

export default function PrepImage({photo,priority=false,headline}:{photo:Photo;priority?:boolean;headline?:string}){
 return <figure className="prep-photo">
  {headline?<PrepCover photo={photo} label={headline} priority={priority}/>:<div className="prep-image">
   {photo.url?<Image src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 640px) 100vw, 800px" priority={priority} fetchPriority={priority?'high':undefined} unoptimized={!photo.url.startsWith('/')}/>:<div className="prep-no-image">설명 이미지를 준비하고 있어요</div>}
  </div>}
  <figcaption>{photo.alt}</figcaption>
 </figure>;
}
