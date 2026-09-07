import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "주말에 뭐하지? 이번 주말, 가고 싶은 곳을 찾아보세요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  // Same logo font already used by the site; cached, with a safe fallback.
  const font = await fetch("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff", { cache: "force-cache" })
    .then(r => r.ok ? r.arrayBuffer() : undefined).catch(() => undefined);
  return new ImageResponse(
    <div style={{display:"flex",width:"100%",height:"100%",background:"#eef4ff",color:"#142443",padding:48,fontFamily:font ? "Gmarket" : "sans-serif"}}>
      <div style={{display:"flex",width:"100%",height:"100%",background:"#fff",borderRadius:32,padding:"48px 52px",flexDirection:"column",justifyContent:"space-between",border:"1px solid #dce6f5"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,color:"#4279ee",fontSize:25}}>
            <svg width="32" height="40" viewBox="0 0 24 30" fill="none"><path d="M12 29S1 18 1 11a11 11 0 1 1 22 0c0 7-11 18-11 18Z" fill="#4279ee"/><circle cx="12" cy="11" r="4" fill="white"/></svg>
            나의 주말 발견
          </div>
          <div style={{display:"flex",fontSize:20,color:"#71809a"}}>mwohaji.kr</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
          <div style={{display:"flex",fontSize:90,fontWeight:700,letterSpacing:-4,lineHeight:1.25}}>주말에 뭐하지?</div>
          <div style={{display:"flex",fontSize:32,color:"#516079",marginTop:22}}>이번 주말, 가고 싶은 곳을 찾아보세요.</div>
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          {["문화행사","나들이","여행코스","캠핑"].map((label,i)=><div key={label} style={{display:"flex",alignItems:"center",justifyContent:"center",background:i===0?"#4279ee":"#eff4fc",color:i===0?"white":"#284265",borderRadius:14,padding:"17px 25px",fontSize:23}}>{label}</div>)}
        </div>
      </div>
    </div>,
    {...size,fonts:font?[{name:"Gmarket",data:font,weight:700,style:"normal"}]:undefined,headers:{"Cache-Control":"public, max-age=3600, s-maxage=86400"}},
  );
}
