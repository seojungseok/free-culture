import type { TourSpot } from "@/lib/tour";
import { getAdmission } from "@/lib/fees";
import SeasonPlaceCard from './SeasonPlaceCard';

function tourTypeLabel(type:string){return type==='14'?'문화시설':type==='28'?'체험·레포츠':'관광지';}
export default function TourCard({spot}:{spot:TourSpot}){
 return <SeasonPlaceCard href={`/places/spot/${spot.id}`} title={spot.title} image={spot.image} meta={spot.addr} description={spot.overview} badge={tourTypeLabel(spot.type)} trailingBadge={getAdmission(spot.id)==='free'?'무료입장':undefined}/>;
}
