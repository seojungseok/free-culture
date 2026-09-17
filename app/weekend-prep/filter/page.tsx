import type {Metadata} from 'next';
import PrepListing, {type PrepListParams} from '../PrepListing';
import {generateMetadata as listingMetadata} from '../page';
import '../prep.css';

export function generateMetadata():Metadata {
  return {...listingMetadata(),robots:{index:false,follow:true}};
}
export default async function Page({searchParams}:{searchParams:Promise<PrepListParams>}){
  return <PrepListing params={await searchParams}/>;
}
