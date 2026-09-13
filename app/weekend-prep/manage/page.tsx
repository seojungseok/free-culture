import PrepAdmin from '@/components/PrepAdmin';
import '../prep.css';
export const metadata={title:'주말 준비물 관리',robots:{index:false,follow:false}};
export default function Page(){return <main className="prep"><h1>주말 준비물 작업실</h1><p className="prep-lead">상품 확인부터 이야기 작성, 이미지 연결과 발행까지.</p><PrepAdmin/></main>;}
