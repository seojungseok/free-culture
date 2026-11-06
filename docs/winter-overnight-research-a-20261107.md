# 겨울 1박2일 북부·중부 10편 조사 기록

- 작성·공식 출처 확인일: 2026-11-07, Asia/Seoul. 일부 HTTP 확인 시각은 UTC 기준 2026-11-06이다.
- 원고: `data/winter-overnight-editorial-a.json`.
- 범위: 서울, 인천 강화, 경기 여주, 강원 동해·삼척/춘천, 충북 청주, 충남 공주, 대전, 세종, 전북 전주.
- 기존 당일치기 20편 및 다른 원고·런타임 파일은 수정하지 않았다.
- 일반 웹 검색으로 운영기관·지자체·한국관광공사의 공개 자료를 찾고 원문을 확인했다. 브라우저 검색 파서가 동적 페이지 또는 오류를 반환한 경우 공개 페이지 HTTP GET과 HTML 본문으로 보완했다. 로그인·상품 API·신청 제출은 사용하지 않았다.
- 네이버 검색과 관광 API 장소·사진 검증은 별도 API 담당자가 수행했다. 이 파일은 사진 권리 검수 결과를 대신하지 않는다.

## 편집 기준과 검증 결과

원고는 각 지역 현지 도착부터 출발까지의 제안 일정이다. 첫날 2~3곳, 둘째 날 2곳으로 나누었으며 총 46개 경유지다. 10편 모두 `data/winter-overnight-places.json`의 `plans`와 slug, query, day 순서가 일치했다. 여주한글시장은 관광 API 등록을 확정하지 못해 경유지에서 제외하고 식사 선택지로만 남겼다. 문의문화재단지는 검색 query를 보존하면서 노출 명칭을 현행 ‘문의문화유산단지’로 바꿨다.

각 원고의 intro+경유지 설명+본문 단락은 1,771~1,974자다. intro는 155~169자, 가장 짧은 경유지 설명은 156자다. 각 편은 별도 숙박권역, 교통 방식, 도착·귀가 제안과 세 가지 본문 주제를 포함한다. 시간표의 숫자는 관광·체류 계획이며 버스·열차 운행시각 또는 실제 이동시간을 뜻하지 않는다. 운영시간을 본문에 기재한 경우에는 운영기관의 현재 안내를 근거로 삼았다.

특정 숙박업소·가격·객실 조건을 만들어 넣지 않았다. 눈·일출·개화·행사·야간 조명을 볼 수 있다고 보장하지 않았다. 시장은 상설 점포 방문을 기본으로 두고 장날·야시장 운영을 일반화하지 않았다. 직접 방문·시식한 경험이나 별점·판매량은 작성하지 않았다.

## 현재 운영정보와 충돌 처리

### 서울

서울공예박물관 일반 전시의 10~18시 운영, 월요일 원칙 휴관, 일반 방문객 주차장 부재를 확인했다. 11월까지의 일부 야간 운영을 겨울 전체에 확대하지 않았다. 어린이박물관 예약은 일반 전시와 구분했다. 국립중앙박물관 상설 관람과 특별전 조건을 나눴으며 용산가족공원을 용산어린이정원과 혼동하지 않도록 썼다.

### 강화

강화역사박물관의 월요일 휴관과 전등사 입장·주차 조건을 구분했다. 고려궁지에 남은 조선시대 관아·복원 건물을 모두 고려 궁궐 원형으로 표현하지 않았다. 북부 역사박물관·읍내와 남부 전등사·동막해변을 날짜로 분리했다. 겨울 갯벌 체험이나 긴 산성 산행은 기본 일정에서 제외했다.

### 여주

현재 여주박물관 홈페이지는 11~2월 09~17시 운영을 안내한다. 오래된 관광지도 PDF의 연중 18시 표기보다 운영기관 현재 홈페이지를 채택했다. 명성황후생가유적지의 11~2월 09~17시와 종료 30분 전 입장 안내를 반영했다. 한글시장 자체가 없는 것으로 판단한 것은 아니며, API 장소 식별 실패 때문에 정식 경유지에서만 뺐다. 목아박물관의 캐시 홈페이지 값은 두 문자열이 붙은 형태여서 사용하지 않고 대한민국역사박물관 협력망의 공식 소개로 대체했다.

### 동해·삼척

동해시 스카이밸리 안내의 11~3월 10~17시, 종료 30분 전 입장, 월요일 원칙 휴무와 공휴일 대체 휴무를 확인했다. 오래된 요금과 혼용하지 않도록 요금은 원고에서 생략했다. 천곡황금박쥐동굴 공개 페이지는 검색 파서 오류와 달리 직접 GET에서 정상 본문을 확인했다. 연중 14~15도라는 공식 설명을 반영하되 습기·계단이 있는 자연동굴임을 함께 적고 박쥐 관찰을 보장하지 않았다. 삼척해변은 시 경계가 다른 장소이므로 city를 ‘동해·삼척’으로 표기했다.

### 춘천

김유정문학촌의 현재 홈페이지 및 2026-10-29 동절기 안내에서 09:30~17시를 확인했다. 애니메이션박물관 운영기관은 10~18시 운영과 1시간 반~2시간 관람 여유를 안내한다. 세 박물관의 월요일 원칙 휴관과 소양강스카이워크의 화요일 휴장을 구분했다. 스카이워크 종료·입장 시각은 기관과 관광정보의 표현 차이가 있어 정확한 마감 숫자를 본문에 넣지 않고 오후 이른 방문을 제안했다. 문학촌과 애니메이션박물관은 도보로 붙어 있는 장소로 설명하지 않았다.

### 청주

청남대의 현행 충청북도 홈페이지는 12~1월 09~17시, 매표·입장 종료 15:30을 안내한다. 11월이나 2월까지 동일 동절기 시간을 확대하지 않았다. 11월 7일 한정 가을 행사 야간 운영을 겨울 상시 일정에 넣지 않았다. 현재 매표 안내를 근거로 사전 예약이 항상 필수라고 적지 않았다. 옛 고인쇄박물관 jikji 경로의 404 대신 충북관광 공식 소개를 사용했다. 문의문화유산단지는 현행 지자체·API 명칭을 반영했다.

### 공주

무령왕릉과 왕릉원의 11~2월 09~17시, 입장 마감 16:30을 공주시에서 확인했다. 실제 왕릉 내부 입장이 아닌 모형 전시 관람으로 명시했다. 박물관에서 무덤 구조·출토 유물을 먼저 익히고 왕릉원으로 이동하도록 작성했다. 공주역과 시내 관광권의 이동을 따로 확보하도록 안내했다.

### 대전

대전시립미술관 11~2월 10~18시와 월요일 원칙 휴관을 반영했다. 한밭수목원 동원은 월요일, 서원은 화요일 휴원이며 열대식물원은 09~18시·입장 17:30·월요일 휴원으로 각각 구분했다. 열대식물원의 맹그로브·야자 등 구성은 공식 소개를 확인했다. 옛 충남도청 본관의 1932년 건립과 대전근현대사전시관 성격을 박물관 공식 소개로 확인했으며 건물 전체 자유 관람이라고 적지 않았다.

### 세종 — 날짜에 따른 주의가 필요한 원고

대통령기록관 현재 홈페이지는 **2026-11-10~12 상설전시관 전면 휴관, 11-13~18 부분 개관**을 공지한다. intro·경유지 설명·운영 단락에 해당 제한을 반영했다. 11월 19일 이후도 재개 범위를 확인하도록 적었으며 재개가 완료됐다고 주장하지 않았다. 현재 통상 운영은 10~18시다. 예전 공식 PDF의 동절기 17시 종료 정보는 사용하지 않았다.

베어트리파크 공식 도메인은 `beartreepark.com`이며 동명의 비공식 블로그와 구분했다. 현재 안내는 12~2월 오전 10시 개장, 악천후 조기 폐장 가능, 음식물 반입 제한을 포함한다. FAQ의 혹한 임시 휴장 가능성을 반영했다. 현재 공지로 입증하지 못한 겨울 행사·꽃·야간 조명·실내 온실 체험은 일정의 보장된 요소로 넣지 않았다.

### 전주

국립무형유산원 상설전시와 디지털 체험 예약을 구분하고 매일 공연이 있다고 적지 않았다. 전주한옥마을의 야외 거리 개방과 개별 시설 운영시간을 분리했다. 경기전의 11~2월 09~18시를 공식 한옥마을 관광 안내에서 확인했다. 11월 6일 종료된 ‘별빛누빔’ 특별행사는 원고에 사용하지 않았다. 국립전주박물관의 ‘전주와 조선왕실’ 전시를 경기전 관람과 연결했다. 무형유산원 페이지가 발급하는 세션 문자열을 저장하지 않고 깨끗한 공개 경로를 사용했다.

## 검증 범위의 한계

공식 페이지 확인은 발행 당일의 정보 검증이며 이후 운영 변경을 실시간으로 감지한 결과는 아니다. 공개 글의 시간을 제안 일정과 운영시간으로 구분했고, 여행일에 달라지는 예약·휴관·날씨 정보를 실제 확정 사실처럼 쓰지 않았다. 사진은 별도 API 검토 파일의 권리·장소 확인을 통과한 항목으로만 root가 조립한다. 이 조사 기록에는 인증 토큰이나 세션·접근 권한을 포함한 URL을 저장하지 않는다.

## 원고별 공식 출처

아래 목록은 실제 원고의 sources와 동일하며, 모두 2026-11-07 확인이다.

### 서울 겨울 1박2일: 종로 공예 산책과 용산 박물관 여행

- [서울공예박물관 · 관람 및 교통 안내](https://craftmuseum.seoul.go.kr/preview/visit)
- [서울관광재단 · 인사동 도보 코스](https://korean.visitseoul.net/palace/%EC%9D%B8%EC%82%AC%EB%8F%99-%EC%9A%B4%ED%98%84%EA%B6%81-%EC%BD%94%EC%8A%A4/KON000653)
- [종로구 · 광장시장](https://www.jongno.go.kr/chTown.do?menuId=9317&menuNo=9317)
- [국립중앙박물관 · 이용 편의와 오시는 길](https://www.museum.go.kr/MUSEUM/contents/M0105000000.do?menuId=accessibility)
- [서울시 · 주요 공원 안내](https://parks.seoul.go.kr/content.do?key=2604070017)

### 강화 겨울 1박2일: 역사박물관에서 전등사와 동막해변까지

- [강화군 · 관광지 이용요금과 휴관 안내](https://www.ganghwa.go.kr/open_content/tour/guide/entrance.jsp)
- [강화역사박물관 · 운영 공지](https://www.ganghwa.go.kr/open_content/museum_history/news/notice.jsp)
- [인천관광공사 · 강화 고려궁지](https://itour.incheon.go.kr/ssst/ssst/detail.do?cotId=ITD21121613170591901)
- [강화군 · 풍물시장](https://www.ganghwa.go.kr/open_content/tour/tour/tourInfoDetail.do?tour_seq=100)
- [강화군 · 전등사](https://www.ganghwa.go.kr/open_content/tour/tour/tourInfoDetail.do?tour_seq=78)
- [강화군 · 해안 포함 여행코스](https://www.ganghwa.go.kr/open_content/tour/trip/day1_1.jsp)

### 여주 겨울 1박2일: 신륵사 강변과 목아박물관 문화 여행

- [한국관광공사 · 신륵사](https://german.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=77616)
- [여주시 · 여주박물관 현재 전시 및 관람 안내](https://www.yeoju.go.kr/museum/index.do)
- [여주세종문화관광재단 · 한글시장 등 관광 순환 경로](https://www.yjcf.or.kr/cms/content/view/627)
- [대한민국역사박물관 · 목아박물관 협력망 안내](https://www.much.go.kr/cooperation/net/mor.do)
- [여주세종문화관광재단 · 명성황후생가유적지](https://www.yjcf.or.kr/cms/content/view/289)

### 동해·삼척 겨울 1박2일: 묵호 전망대와 추암에서 보는 겨울바다

- [동해시 · 묵호등대](https://www.dh.go.kr/tour/selectTourCntntsWebView.do?ctgryNo=4&key=1620&tourNo=60)
- [동해시 · 도째비골 스카이밸리 동절기 운영](https://www.dh.go.kr/tour/selectTourCntntsWebView.do?ctgryNo=4&key=1620&tourNo=53)
- [동해시 · 천곡황금박쥐동굴](https://www.dh.go.kr/tour/selectTourCntntsWebView.do?ctgryNo=6&key=1622&tourNo=94)
- [동해시 · 추암해변](https://www.dh.go.kr/tour/selectTourCntntsWebView.do?ctgryNo=4&key=1620&tourNo=70)
- [한국관광공사 · 삼척해변](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=97256)

### 춘천 겨울 1박2일: 박물관과 실레마을, 애니메이션 여행

- [국립춘천박물관 · 전시 및 관람 안내](https://chuncheon.museum.go.kr/kor/index.do)
- [한국관광공사 · 춘천 명동 닭갈비골목](https://access.visitkorea.or.kr/ms/detail.do?cotId=22b8d574-89ba-46e7-acff-e7293d87bffc)
- [춘천도시공사 · 소양강스카이워크](https://rev.cuc.or.kr/www/16)
- [김유정문학촌 · 동절기 관람 안내](https://www.kimyoujeong.org/)
- [강원정보문화산업진흥원 · 애니메이션박물관 이용 안내](https://www.gica.or.kr/Ani/M10000/M10100/html)

### 청주 겨울 1박2일: 직지와 공예, 청남대 호반 산책

- [충청북도 관광 · 청주고인쇄박물관](https://tour.chungbuk.go.kr/www/contents.do?key=303)
- [한국관광공사 · 문화제조창](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=94c9f273-9d65-44bd-a72a-1615fb3ab078)
- [청주시 문화관광 · 수암골과 문의문화유산단지](https://www.cheongju.go.kr/ktour/index.do)
- [청남대 · 동절기 관람 및 입장 안내](https://www.chungbuk.go.kr/chnam/content.do?key=2004170433966)
- [한국관광공사 · 문의문화유산단지](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=89812)

### 공주 겨울 1박2일: 공산성과 무령왕릉을 깊이 보는 백제 여행

- [공주시 · 공산성](https://www.gongju.go.kr/tour/sub01_01_02.do)
- [한국관광공사 · 공주산성시장](https://access.visitkorea.or.kr/ms/detail.do?cotId=d017f8a4-c559-414b-8adf-9c2c2b02aeab)
- [한국관광공사 · 국립공주박물관](https://access.visitkorea.or.kr/ms/detail.do?cotId=28e47a61-d8d5-4739-bfbf-f2b89d0e5b9d)
- [공주시 · 무령왕릉과 왕릉원 관람 안내](https://www.gongju.go.kr/tour/sub01_01_03.do)
- [한국관광공사 · 왕릉 모형 전시 안내](https://access.visitkorea.or.kr/opentour/detail.do?cotId=bc81ed18-d438-49df-a54d-175ca3e12e0e)

### 대전 겨울 1박2일: 미술관·온실과 원도심 역사 산책

- [대전시립미술관 · 동절기 관람 안내](https://www.daejeon.go.kr/dma/dmaContentsHtmlView.do?menuSeq=6079)
- [한밭수목원 · 관람시간과 휴원일](https://www.daejeon.go.kr/gar/contentsHtmlView.do?menuSeq=8024)
- [한밭수목원 · 열대식물원 구성](https://www.daejeon.go.kr/gar/contentsHtmlView.do?menuSeq=2312)
- [대전시립박물관 · 근현대사전시관 소개](https://www.daejeon.go.kr/his/HisContentsHtmlView.do?menuSeq=5804)
- [대전 동구 · 중앙시장](https://donggu.go.kr/dg/tour/84/7/sights)

### 세종 겨울 1박2일: 기록관과 금강에서 조치원시장까지

- [대통령기록관 · 2026년 11월 상설전시관 휴관 공지](https://www.pa.go.kr/index.jsp)
- [대통령기록관 · 방문 안내](https://www.pa.go.kr/portal/introduce/visit/visitInfo.do)
- [한국관광공사 · 이응다리](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=c95db770-ff20-4a0c-bf2b-c45bc2a6335d)
- [베어트리파크 · 동절기 이용 안내](https://beartreepark.com/information)
- [베어트리파크 · 임시 휴장 등 자주 묻는 질문](https://beartreepark.com/)
- [한국관광공사 · 세종전통시장](https://access.visitkorea.or.kr/ms/detail.do?cotId=1ec47b92-4cd3-40ea-a82c-4930e6ef0899)

### 전주 겨울 1박2일: 무형유산과 한옥, 왕실 문화를 잇는 여행

- [국립무형유산원 · 관람 안내](https://www.nihc.go.kr/index.9is?contentUid=ff8080816f40a80f016f7edcddc80dd1)
- [국립무형유산원 · 상설전시 소개](https://www.nihc.go.kr/)
- [전주시 · 전주한옥마을 공식 안내](https://hanok.jeonju.go.kr/)
- [한국관광공사 · 전주남부시장](https://access.visitkorea.or.kr/opentour/detail.do?cotId=90cd3499-2557-4a20-90c5-97c74915e6de)
- [전주시 · 경기전 등 한옥마을 문화시설](https://hanok.jeonju.go.kr/contents/place)
- [국립전주박물관 · 상설전시 안내](https://jeonju.museum.go.kr/)
