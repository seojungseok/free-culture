# 준비물 버튼 단순화와 방문자 표시 복구

사용자 요청에 따라 준비물 목록은 재료명과 `최저가 알아보기` 버튼만 표시한다. 상품 사진·판매 상품명·포장 안내·체크박스·사진 아래 + 메뉴와 상품 팝업을 제거했다. 본문 사진, 짧은 AI 표시, 상단 제휴 고지, 44개 글의 URL과 430개 항목의 원본 제휴 링크·클릭 측정은 보존한다. 상품 데이터와 검토 기록은 삭제하지 않는다.

기존 방문자 표시는 최초 구현부터 Abacus의 `weekendpick-kr` 네임스페이스와 `total`, `dYYYYMMDD` 키를 이용하고 있었다. 기존 기록이 정상 조회되는 것을 확인했으며 생성·설정·초기화 API는 사용하지 않았다.

- 브라우저는 같은 사이트의 `/api/visitors`를 이용하고 서버가 원래 공용 카운터를 조회한다. GET은 조회만 하며 20초 동안 재사용한다.
- 원래 한국시간 일자와 `vc_YYYYMMDD` sessionStorage 표시를 유지한다. 중복 증가를 막기 위해 요청 전에 표시를 남긴다.
- 실패하거나 결과가 불명확한 증가 요청을 다시 보내지 않는다. 이후 조회만 시도하며 임의의 0이나 가짜 누적값을 표시하지 않는다.
- 저장소 접근이 제한돼도 조회는 계속한다. 로컬·미리보기는 방문 수를 늘리지 않으며 POST는 운영 사이트 Origin에만 허용한다.
- 하단 표시는 원래의 `오늘 N · 전체 N` 형태를 유지한다. 응답을 기다릴 때는 `방문자 수 집계 중`을 표시한다.

검증은 실제 집계를 늘리지 않는 모의 테스트로 한국시간 경계, 이전 네임스페이스와 누적값 보존, 읽기 캐시, 증가 요청 중복 방지, 저장소 제한·로컬 미리보기를 확인한다. 실제 화면과 운영 API에서는 조회만 이용한다.

```sh
node --test scripts/visitor-count.test.mjs scripts/prep/affiliate-publisher.test.mjs scripts/prep/complete-guide-links.test.mjs scripts/affiliate-events.test.mjs scripts/prep/content.test.mjs
node scripts/prep/verify-affiliate-render.mjs BASE_URL
```

첫 검사는 22개 테스트이며, 두 번째는 44개 글의 430개 원본 링크·동일 버튼 문구·간단한 행 구성·SEO 보존을 확인한다. 쿠팡 상품 API 신규 호출과 제휴 목적지 방문은 없다.
