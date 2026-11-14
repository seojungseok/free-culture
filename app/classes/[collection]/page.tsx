import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import ClassDirectory from '@/components/ClassDirectory';
import {classCollections,type ClassCollection,type DiscoveryQuery} from '@/lib/publicDiscovery';
export const revalidate=3600;
type Props={params:Promise<{collection:string}>;searchParams:Promise<DiscoveryQuery>};
function collectionKey(value:string):ClassCollection{if(!['free','weekend','family'].includes(value))notFound();return value as ClassCollection;}
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{const key=collectionKey((await params).collection),info=classCollections[key],q=await searchParams;return {title:info.title,description:info.description,alternates:{canonical:info.href},...(Object.values(q).some(Boolean)?{robots:{index:false,follow:true}}:{})};}
export default async function ClassCollectionPage({params,searchParams}:Props){return <ClassDirectory collection={collectionKey((await params).collection)} query={await searchParams}/>;}
