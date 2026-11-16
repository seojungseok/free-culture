export const PLAYGROUND_SOURCE='https://www.data.go.kr/data/15124519/openapi.do';
export const PLAYGROUND_PLACES={A003:'도시공원',A031:'하천',A033:'공공도서관'};
const text=value=>typeof value==='string'?value.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim():typeof value==='number'?String(value):'';
const coordinate=(value,min,max)=>{const n=Number(value);return Number.isFinite(n)&&n>=min&&n<=max?n:null;};
export function normalizePlayground(row,checkedAt){
 const id=text(row.pfctSn),name=text(row.pfctNm),placeCode=text(row.instlPlaceCd),rawAddress=[text(row.ronaAddr),text(row.ronaDaddr)].filter(Boolean).join(' ')||[text(row.lotnoAddr),text(row.lotnoDaddr)].filter(Boolean).join(' '),region=text(row.rgnCdNm),address=rawAddress&&!areaFor(rawAddress)&&region?region+' '+rawAddress:rawAddress;
 if(!/^\d{1,20}$/.test(id)||!name||!address||!Object.hasOwn(PLAYGROUND_PLACES,placeCode))return null;
 const ownership=text(row.prvtPblcYnCdNm),operation=text(row.operYnCdNm),closed=!!text(row.clsgYmd)&&!/^0+$/.test(text(row.clsgYmd))||operation!=='운영';
 return {id,name,address,region:text(row.rgnCdNm),area:areaFor(address)||areaFor(text(row.rgnCdNm)),placeCode,place:PLAYGROUND_PLACES[placeCode],ownership,operation,active:!closed,indoorOutdoor:text(row.idrodrCdNm),waterEquipment:row.wowaStylRideCd==='X001'?true:row.wowaStylRideCd==='X002'?false:null,latitude:coordinate(row.latCrtsVl,32,40),longitude:coordinate(row.lotCrtsVl,123,133),installedAt:text(row.instlYmd),source:PLAYGROUND_SOURCE,checkedAt,listed:true};
}
export function areaFor(address){if(/^전남광주/.test(address)){return /^전남광주(?:통합특별시)?\s+(광산구|동구|서구|남구|북구)(?:\s|$)/.test(address)?'광주':'전남';}const aliases=[['서울','서울'],['부산','부산'],['대구','대구'],['인천','인천'],['광주','광주'],['대전','대전'],['울산','울산'],['세종','세종'],['경기','경기'],['강원','강원'],['충북','충북'],['충남','충남'],['전남','전남'],['경북','경북'],['경남','경남'],['충청북','충북'],['충청남','충남'],['전북','전북'],['전라북','전북'],['전라남','전남'],['경상북','경북'],['경상남','경남'],['제주','제주']];return aliases.find(([prefix])=>address.startsWith(prefix))?.[1]||'';}
export function isPlaygroundCandidate(item){return item.active&&item.operation==='운영'&&item.listed!==false&&Object.hasOwn(PLAYGROUND_PLACES,item.placeCode)&&item.ownership==='공공'&&Boolean(item.area);}
