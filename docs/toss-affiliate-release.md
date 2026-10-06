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
