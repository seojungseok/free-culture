# 가을 캠핑 재료 체크리스트 10편

## 범위

- 기존 꽃게탕 재료 체크리스트를 참고한 서로 다른 10개 요리. 기존 공개 24개 글과 기존 63개 상품 레코드, 제휴 URL은 그대로 보존한다.
- 돼지고기 김치찌개, 된장찌개, 들깨버섯탕, 감자수제비, 새우버터구이, 고등어감자조림, 닭볶음탕, 떡볶이, 애호박전, 버터콘치즈.
- 글당 재료 중심 썸네일 1장, 추가 재료 장면 1장, 완성 음식과 도구 장면 1장. 30장 모두 개별 생성·검토, 1200×800 WebP 합계 약 4.73MB. 이미지별 3~4개 실제 상품 사진 출처·태그 좌표 기록.
- 이미지 생성에는 imagegen 스킬을 적용했다. 생성/수정 이력의 최종 원본 경로와 프롬프트는 `data/autumn-recipes-20260919-images.json`에 기록한다.

## 상품 검증과 API 상한

- 신규 검색 22건은 모두 `coupangFetch` → GitHub 공용 CAS 제한기를 사용했다. 기존 실행 기록을 건너뛰며 단일 추가 검색은 `--only=corn-alternative`로 한정했다.
- 직전 60초 최대 10회·10상품, 시작 간격 6.1초. 사용자의 15개 상한보다 엄격한 기존 정책을 유지했다. 키와 공용 잠금은 변경·출력하지 않았다.
- 품절인 오뚜기 스위트콘 198g×4 옵션은 공개 자료에 포함하지 않고 실제 판매 화면을 확인한 리치스 340g×5로 교체했다. 해당 썸네일의 캔도 다시 제작했다.
- 35개 원본 제휴 링크의 상품 ID 리다이렉트는 일치했다. 판매 화면 HEAD는 403이므로 정상 HTTP로 오인하지 않았다. 새 상품 13개는 브라우저에서 실제 itemId/vendorItemId의 상품명·선택 옵션을 확인했다.
- API 조회 결과나 이미지의 묶음 수를 한 끼 분량으로 설명하지 않는다. 가격·배송·별점·지속적인 재고를 보장하지 않으며 기존 재료 소분·대체를 안내한다.

## 검색 의도와 SEO

- 제목/H1은 `감자수제비 재료 체크리스트 | 가을 캠핑 준비물`처럼 요리명+재료를 앞에 둔다. 고유 설명, 첫 H2와 첫 문단의 실제 재료 목록, 역할별 체크리스트, 조리 준비·순서·대체·정리 정보를 제공한다.
- 띄어쓰기 변형별 중복 페이지나 키워드 나열을 만들지 않는다. 검색어가 붙어 있어도 같은 검색 의도를 충실하게 다루며 노출·순위를 보장하지 않는다.
- 기존 공통 경로를 통해 서버 HTML, canonical, Article/Breadcrumb, OG/Twitter 이미지, 실제 updatedAt 기반 sitemap을 유지한다. 전체 준비물 디렉터리와 관련 요리·캠핑·계절 링크로 연결한다.
- Google 제목 가이드: https://developers.google.com/search/docs/appearance/title-link
- Google 내부 링크 가이드: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- 네이버 콘텐츠 마크업: https://searchadvisor.naver.com/guide/markup-content
- 식품 안전 참고: https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?bbs_no=bbs001&menu_no=3120&ntctxt_no=1094593

## 배포 전 검증

- 기존 콘텐츠·상품 딥 비교: 24개 글/63개 상품 변경 없음.
- content/shoppable/images 테스트 20개 + 신규 회귀 테스트 1개 통과.
- Next.js production build 1,113개 페이지, TypeScript 통과. 기존 범위의 lint 경고는 보존하며 이번 작업에서 무관한 리팩터링은 하지 않았다.
- 신규 10개 URL HTTP 200, 사진 30개 HTTP 200, canonical·고유 메타·Article/Breadcrumb·sitemap·전체 디렉터리 링크 확인.
- 10개 글 전체 320px/375px 가로 넘침 없음. 대표 감자수제비/버터콘치즈는 320/360/375/390/430/1280px 확인. 체크리스트 저장·새로고침·체크 해제 정상. 검증 탭에서 React #418 및 오류 로그 없음.
- `node scripts/prep/verify-autumn-recipes-20260919.mjs`를 사용하며 실제 배포 검증은 `PREP_VERIFY_BASE`로 운영 주소를 지정한다.
- 방문자마다 AI·쿠팡 API를 호출하지 않는다. JSON과 정적 글, 압축 이미지의 기존 서빙 구조를 그대로 사용한다.
