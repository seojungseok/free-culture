import type {Metadata} from 'next';
import ExperienceDirectory from '@/components/ExperienceDirectory';
import type {DiscoveryQuery} from '@/lib/publicDiscovery';
export const revalidate=3600;
export async function generateMetadata({searchParams}:{searchParams:Promise<DiscoveryQuery>}):Promise<Metadata>{return {title:'전국 체험·교육 프로그램 — 지역별 가족·과학관·농촌 체험',description:'전국 가족·청소년 활동, 과학관 교육, 농촌·어촌 체험을 지역별 사진 카드로 찾아보세요. 체험 내용·일정·비용·주소를 내부 상세 페이지에서 읽고 공식 신청처로 연결할 수 있습니다.',alternates:{canonical:'/experiences'},...(Object.values(await searchParams).some(Boolean)?{robots:{index:false,follow:true}}:{})};}
export default async function ExperienceHub({searchParams}:{searchParams:Promise<DiscoveryQuery>}){return <ExperienceDirectory query={await searchParams}/>;}
