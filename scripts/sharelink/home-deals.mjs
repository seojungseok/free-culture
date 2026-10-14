export function homeDealGroup(name='') {
 if(/콜라겐|건강기능|영양제|유산균|비타민/.test(name))return null;
 if(/소고기|토시살|안창살|삼겹살|목살|꼬들살|불고기|순대|핫바|핫도그|라면|햇반|옥수수|닭갈비|닭꼬치|소시지|떡볶이|만두|어묵|꼬치/.test(name))return 'camp';
 if(/우유|두유|생수|탄산|콜라|식빵|프라이즈|즉석밥|명란젓|튀김|스프|버터바|전복장|낭시에|김치|타트체리|과자|누룽지|감태|다슬기|에너지드링크|시래기국|견과|주스|쥬스|커피|샌드위치|김밥|김자반|김구이|도시락|보냉백|보냉가방|피크닉매트|돗자리|휴대용수저/.test(name))return 'daily';
 return null;
}
export function eligibleHomeDeal(deal,detail,now=Date.now()) {
 return Boolean(homeDealGroup(deal?.displayName)&&!deal?.isSoldOut&&!detail?.isSoldOut&&Date.parse(deal?.endAt)>now&&deal?.tacaItemId===detail?.tacaItemId&&deal?.displayName===detail?.displayName&&deal?.displayPrice===detail?.displayPrice&&detail?.mainImageUrls?.some(u=>u.startsWith('https://')));
}
