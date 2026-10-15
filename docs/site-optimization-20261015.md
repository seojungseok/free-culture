# 홈페이지 최적화 — 2026-10-15

기존 홈 순서, 상세 URL, 발행 상태와 제휴 추적을 유지했다.

## 적용
- 광고 영역의 상품 데이터 요청과 갱신 타이머를 루트 공급자 하나로 공유. 숨겨진 탭은 갱신을 쉬며, 요청은 10초 제한과 최소 60초 간격을 적용한다. 오래되거나 종료된 가격은 기존 유효성 검사로 제외한다.
- 새 가을·겨울 광고 원본 2170×725를 유지하고 868×290, 1302×435 WebP를 추가. 모바일 파일은 36,198~40,020바이트로 원본보다 약 76~77% 작다. 사용하지 않는 예전 광고 사진 선행 다운로드를 제거했다.
- 기존 지역별 나들이 안에 이번 주말 행사·아이와·무료 행사 조건을 추가. 명시적으로 선택한 지역만 이 브라우저에 저장한다. 무료는 데이터에서 무료로 확인된 행사만 포함한다.
- 통합 검색에서 종료일이 지난 행사·축제를 제외한다. 현재 축제 원본 328건 중 종료된 108건이 대상이며 상세 URL과 원본 데이터는 보존한다.
- 실제 내용이 바뀔 때만 contentUpdatedAt을 기록하고 장소·음식점 사이트맵 lastmod에 반영한다. 수집 확인 시간이나 배포 시간으로 전체 수정일을 갱신하지 않는다.
- NAS는 확인한 Git 커밋으로 빌드하고 실제 응답 커밋 일치 및 주요 12개 경로를 검사한 뒤 성공을 기록한다. 이전 컨테이너의 HTTP 200만으로 성공 처리하지 않는다. 초기 버전 표식이 없는 설치도 다음 실행에서 복구한다.

## 확인
- Next.js 프로덕션 빌드 및 타입 검사 통과.
- 수집·보존·필터 관련 42개 테스트와 배포 검증 테스트 1개 통과.
- SEO 검사 통과, 사이트맵 14,670개 URL 보존. 속초문화원 수정일 2026-10-15T11:32:56.555Z 반영.
- 실제 로컬 프로덕션 브라우저: 상품 데이터 요청 1회. 경기 지역 기억, 아이와/무료 조건 결과 확인.
- 320px·390px·1280px 가로 넘침 없음, 새 조건 버튼 최소 높이 44px, 콘솔 오류 없음. 모바일 868px 광고 파일 선택 확인.
- 실제 검색 순위·색인·유입 증가는 Search Console/분석 계정 자료를 확인하지 않았으므로 측정하지 않았다.

## 참고한 1차 자료
- Google 사이트맵 lastmod: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google JavaScript 검색 처리: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- GitHub SWR 공유 갱신 상태 참고: https://github.com/vercel/swr/blob/main/src/_internal/utils/global-state.ts
- GitHub Next.js 지연 로딩 구현 참고: https://github.com/vercel/next.js/blob/canary/packages/next/src/shared/lib/dynamic.tsx

새 패키지나 불필요한 자동 발행·API 작업은 추가하지 않았다.
