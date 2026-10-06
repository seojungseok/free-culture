export function homeDealGroup(name='') {
 if(/토시살|안창살|삼겹살|목살|불고기|순대|핫바|컵라면|햇반/.test(name))return 'camp';
 if(/우유|두유|생수|탄산|콜라|식빵|프라이즈|즉석밥/.test(name))return 'daily';
 return null;
}
export function eligibleHomeDeal(deal,detail,now=Date.now()) {
 return Boolean(homeDealGroup(deal?.displayName)&&!deal?.isSoldOut&&!detail?.isSoldOut&&Date.parse(deal?.endAt)>now&&deal?.tacaItemId===detail?.tacaItemId&&deal?.displayName===detail?.displayName&&deal?.displayPrice===detail?.displayPrice&&detail?.mainImageUrls?.some(u=>u.startsWith('https://')));
}
