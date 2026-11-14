import type {Metadata} from 'next';
import ClassDirectory from '@/components/ClassDirectory';
import {classCollections,type DiscoveryQuery} from '@/lib/publicDiscovery';
export const revalidate=3600;
export async function generateMetadata({searchParams}:{searchParams:Promise<DiscoveryQuery>}):Promise<Metadata>{const q=await searchParams;return {title:classCollections.all.title,description:classCollections.all.description,alternates:{canonical:'/classes'},...(Object.values(q).some(Boolean)?{robots:{index:false,follow:true}}:{})};}
export default async function ClassesPage({searchParams}:{searchParams:Promise<DiscoveryQuery>}){return <ClassDirectory query={await searchParams}/>;}
