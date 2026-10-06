# 토스·티켓·숙소 제휴 운영

기존 글과 URL을 유지하며 내 주변 갈 만한 곳 아래에 낮고 넓은 기획전 슬라이드와 좌우 드래그 상품 목록을 배치한다. 고기·생수·여행 음료·휴대 준비물·와그·세시간전은 순서대로 6초 자동 전환하며 일시정지, 포커스·호버 정지와 모션 감소 설정을 지원한다. 글 하단 숙소·티켓 카드는 작은 가로형으로 배치한다. 토스 상품 이미지와 구매 버튼 모두 원본 제휴 링크로 이동한다. 티켓은 현재 유효성을 확인한 허브아일랜드부터 노출한다. 숙소는 기존 세시간전 원본 링크 `https://3ha.in/r/722026`를 보존한다. 지역 자동 선택이나 일률적인 할인액을 약속하지 않는다.

## 갱신과 사실 확인

- NAS `runtime/sharelink.env`에만 키와 publisher ID를 저장한다. 앱 컨테이너에는 키를 전달하지 않는다.
- 기존 매시간 NAS source sync 작업에서 `scripts/nas/refresh-sharelink.sh`를 실행한다. 방문자는 공개 캐시만 읽는다.
- `scripts/sharelink/editorial.mjs`의 검토된 동일 상품 ID·정확한 상품명·원본 사진이 유지되는 경우에만 갱신한다. 품절, 옵션 변경, 조회되지 않는 상품은 제외한다.
- 공개 파일은 `runtime/sharelink/public/editorial.json`. 데이터가 6시간 이상 오래되면 상품과 가격을 숨긴다. 실패 시 기존 파일은 보존한다.
- 하루특가 `endAt`이 확인된 동일 상품에만 종료 시각을 붙인다. 시각이 지나면 서버·화면 모두 제외한다. 0건은 정상이다. 공개 특가 시작 시각과 남은 수량은 확인되지 않아 표시하지 않는다.
- 피크닉 매트의 판매처 공통 사진은 블루 예시이고 연결 옵션은 옐로우다. 사진 설명과 연결 옵션을 함께 표시한다. 사진을 변형하거나 합성하지 않는다.
- 토스 대가성 문구를 상품 영역에 표시하고 티켓·숙소 고지는 각각 해당 영역에 둔다. 다른 제공자 문구를 일괄 교체하지 않는다.

## 측정

노출·클릭·저장을 익명 이벤트로 수집한다. NAS `runtime/sharelink/events/YYYY-MM-DD.jsonl`에는 개인정보 없이 페이지·제휴사·위치·상품 식별번호만 저장한다. 50% 화면 노출에서 노출 이벤트를 기록하며 같은 화면의 중복 기록을 막는다. 외부 구매 완료는 사이트 클릭 로그로 추정하지 않고 제휴사 구매·예약 실적으로 별도 확인한다.

토스 subTag: `mwohaji_home`, `mwohaji_picnic`, `mwohaji_camping`, `mwohaji_cooking-pot`, `mwohaji_cooking-pan`. 국물 요리에는 냄비, 볶음·전·구이에는 팬을 연결한다. 원본 발급 링크를 사용한다. 700명 중 10명 구매는 방문자 대비 약 1.43% 목표다. 예를 들어 제휴 클릭 후 구매 전환율이 10%라면 하루 100명의 제휴 클릭이 필요하다. 이것은 목표 계산이며 예상 실적이 아니다.

검증: 만료 경계, 오래된·미래 시각 캐시, 정상 0건과 HTTP 200 사업 오류 테스트, Next 빌드, 공개 API·제휴 연결·390px UI 확인.

숙소 배너는 imagegen 기본 도구로 만든 일반 객실 분위기 이미지다. 실제 특정 숙소로 오해하지 않도록 AI 연출 문구를 표시한다. 생성 프롬프트: ivory linen hotel bed, warm wood, green mountain window at golden morning, premium editorial photograph, no people/text/logos/price claims. 파일: public/affiliate-images/weekend-stay-v2.webp. 상품 사진은 실제 판매처 원본을 유지한다.

지역별 나들이 뒤와 캠핑 뒤에 145px급(모바일 콘텐츠 기준 약 170px) 낮은 중간 기획전을 배치한다. 중간 배너도 동일한 유효 상품·원본 링크만 쓰며 별도 시작 항목에서 6초 전환한다. 풀무원 상품을 임의로 등록하거나 광고를 복제하지 않는다.
고기 배너 배경: public/affiliate-images/weekend-picnic-v2.webp. imagegen 기본 도구 프롬프트: warm autumn picnic table and forest bokeh, clean dark green negative space, no food/products/text/people/logos. 실제 상품은 원본 사진으로 별도 노출하고 배경 AI 표시를 붙인다.
추가 검토 상품: 코카콜라 500ml 24개, 햇반 210g 24개, 양념 목살 600g 3개. 품절인 햇반 36개와 고추장 불고기는 제외했다. 할인율은 토스 표시 기준이며 하루특가는 유효한 endAt이 있는 항목만 구분한다. 콜라 배경 파일 public/affiliate-images/weekend-cola-v2.webp는 imagegen 기본 도구로 생성했다. 프롬프트: cherry red cold cola campaign background with ice and condensation, negative space, no bottles/cans/logos/people/text; 원본 상품 사진 별도 노출.
중간 띠 배너는 별도 큰 버튼과 상단 라벨을 줄여 실제 높이를 낮춘다. 제목·이미지는 모두 클릭 가능하고 조작 버튼은 유지한다.

컵라면: 육개장 18개+김치 6개 구성의 실제 판매처 사진·가격·옵션을 검토했다. 캠핑에서 김이 올라오는 라면을 젓가락으로 드는 배경은 AI 일반 연출로 표시하며 해당 상품의 조리 결과라고 주장하지 않는다. imagegen 기본 프롬프트: macro steaming unbranded ramen lifted by chopsticks at a misty mountain campsite sunrise, dark negative space, no logo or text. 파일 public/affiliate-images/weekend-ramen-v2.webp.

## 2026-10-07 가로 광고 재구성

쿠팡 공개 홈페이지 DOM의 이미지 원본 및 렌더링 치수를 확인했다. 메인은 1920×450 원본과 높이 450px, 중간 띠는 980×140 원본과 1020×145.7 표시로 7:1 비율이다. 공개 참고: https://www.coupang.com/ . 소스 광고를 복제하지 않고 이 비율을 기준으로 자체 광고를 구성한다.

첫 기획전은 캠핑 먹거리 6개(양념 목살·삼겹살·편육·컵라면·햇반·순대), 두 번째는 음료와 생활 품목 5개(콜라·생수 2종·두유·휴대 티슈), 세 번째는 와그·세시간전으로 나눈다. 판매량을 검증하지 않은 '베스트셀러' 문구는 사용하지 않는다. 토스의 확인한 할인율과 SALE을 표시하며 정상 할인 상품에 하루특가 종료시간을 만들지 않는다. 전환은 사용자 요청에 따라 1.5초, 호버·포커스·일시정지·화면 밖·움직임 줄이기 설정에서는 멈춘다.

최종 배너를 네이티브 HTML/CSS로 구성한다. 메인 1920px 폭 기준 높이450px, 중간 aspect-ratio 7/1, 모바일 중간132px이다. 가격·문구·원본 상품 증빙·광고 장면을 별도 레이어로 배치한다. 사진에 cover 크롭을 사용하지 않고 contain으로 전체를 보존한다. 신규 이미지는 비율을 유지한 리사이즈와 WebP 압축만 했으며 자르지 않았다.

imagegen 기본 내장 도구 생성 프롬프트 요약 및 저장 경로:
- public/affiliate-images/camp-meat-v3.webp: sizzling grilled pork mountain with a tiny campsite, premium surreal food photography, no text/logo/price.
- public/affiliate-images/camp-rice-v3.webp: glossy rice bowl floating as a sunset cloud over a campsite, no text/logo/price.
- public/affiliate-images/camp-water-v3.webp: high-speed water splash forms transparent mountains, no text/logo/price.
- public/affiliate-images/camp-drink-v3.webp: creamy grain beverage pours into a golden road to a campsite, no health claims/text/logo/price.
- public/affiliate-images/camp-sundae-v3.webp: generic sundae platter with steam forming a tent constellation, no text/logo/price. Full scene inside short horizontal frame.
- public/affiliate-images/ramen-galaxy-v3.webp: lifted golden noodles become the Milky Way above a campsite; steaming generic cup, no text/logo/price.

위 AI 장면은 실제 상품 조리 사진이 아니다. 원본 상품 사진은 별도 '실제 연결 상품' 레이어로 유지하고 각 영역에 대가성 및 AI 표시를 한다. 생성된 일반 돼지고기 슬라이스 시안(output/imagegen/pork-platter-concept.png)은 편육 외형과 다르므로 배포 배너에 사용하지 않았다.

추가 순대 선택: 773646201, 맛팜 옛고을 찰순대400g+내장모둠500g, 원본 사진 https://shopping.toss.im/live/temp/2026-02-03/34c623c6-7d78-47ff-8170-65ddc7af7a42.jpeg . API에서 판매 가능, 표시가격8900원·할인율54%를 확인하고 원본 사진을 시각 검토했다. 정가 대비 표시 할인이지 타 쇼핑몰 최저가 비교 결과가 아니다. mwohaji_home 및 mwohaji_sundae 원본 추적 링크를 발급했다.

## 2026-10-07 시간 한정 특가 및 숙소 이미지 수정
홈 광고는 today-deals 결과 중 캠핑 먹거리와 음료·간편식만 선택한다. 상세 API에서 같은 상품명·가격·판매 가능·사진을 대조하고 endAt이 미래인 상품만 연결한다. 할인율만 있는 일반 상품은 홈 특가에 쓰지 않으며 기존 본문 상품과 추적 URL은 보존한다. 종료 시각 경계에서 자동 숨김 및 API 오류·일반 상품 제외 테스트를 적용했다. 소고기와 돼지고기는 서로 다른 판매처 원본 사진이며 같은 AI 캠핑고기 사진을 반복하지 않는다. `실제 연결 상품` 문구는 삭제했다.

숙소는 문구와 원본 AI 객실 사진을 포함한 독립 SVG 배너 이미지(stay-poster-v4.svg, 2100×300; 모바일 stay-poster-mobile-v4.svg, 1050×300)로 구성한다. 글자·사진을 자르지 않고 배너 전체가 기존 세시간전 원본 링크로 연결된다. 객실 사진은 특정 숙소 실사진이 아니라 AI 연출임을 표시한다. 내장 imagegen으로 새 시안 2개를 만들었으나 흰 여백이 과도해 적용하지 않고 기존 객실 사진을 담은 원래 7:1 SVG 디자인을 사용했다. 생성 시안은 generated_images에 보존했다.

토스 수집기는 상품 조회 10개씩 분할하고 서버 상태 파일에 요청 및 상품 수를 기록해 직전60초 각각10을 넘으면 대기한다. 혼합27회 호출 가상시간 테스트로 각 rolling window를 검증했다. 이는 토스 수집기별 보수적 제어이며 쿠팡의 GitHub CAS 공용 게이트는 그대로 유지한다. 방문자에게는 캐시된 공개 feed만 제공한다.
