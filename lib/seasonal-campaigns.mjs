// Generic AI serving scenes; the product name/options/price always come from
// the verified feed. Coffee candy must never inherit the coffee-drink creative.
export function seasonalCampaign(product) {
 const name=product?.name||'';
 if (/어묵/.test(name)) return {art:'winter-fishcake-20261015',label:'어묵탕',title:'찬바람 부는 날, 어묵탕 한 냄비',priority:0};
 if (/커피/.test(name)&&!(/사탕|캔디|믹스|라테|라떼/.test(name))) return {art:'autumn-coffee-20261015',label:'따뜻한 커피',title:'가을 산책 끝에, 따뜻한 커피 한 잔',priority:1};
 if (product?.topic==='ramen') return {art:'winter-ramen-20261015',label:'컵라면',title:'쌀쌀한 캠핑 밤, 따뜻한 한 컵',priority:2};
 return null;
}
