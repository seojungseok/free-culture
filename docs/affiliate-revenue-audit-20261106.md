# 제휴 수익 경로·계측 점검 — 2026-11-06

이 문서는 코드 점검과 로컬 검증 결과다. 실제 제휴 매출·구매 전환·정산액·운영 GA4 수신량은 조회하지 않았다. 광고비 집행, 신규 제휴 링크 발급, 외부 분석 서비스 추가, 개인정보 수집 추가는 하지 않았다.

## 적용한 전문가 역할

- Growth Hacker: 방문 → 제휴 노출 → 외부 상품 클릭을 구분하고, 기록이 성립하는지 먼저 확인했다. 클릭을 구매나 매출로 취급하지 않는다.
- Ad Creative Strategist: 기존 고정 토스 5상품의 상품명·가격·CTA 연결, 하루특가의 종료·할인 조건, 숙소 광고 고지를 검토했다. 검증되지 않은 할인·인기·판매량 문구를 추가하지 않았다.
- Tracking & Measurement Specialist: 클라이언트 발신 값과 서버 수신 계약, 노출 기준, 재전송 동작을 대조하고 결함을 수정했다.

역할 지침: agency-agents의 marketing/marketing-growth-hacker.md, paid-media/paid-media-creative-strategist.md, paid-media/paid-media-tracking-specialist.md. 해당 문서의 예시 성장률·CTR·전환 목표는 이 사이트의 달성 성과가 아니다.

## 확인한 결함과 수정

| 대상 | 기존 문제 | 수정 |
| --- | --- | --- |
| 고정 토스 메인 배너 | 발신 위치 home_winter_hero가 수신 API의 허용 목록에 없어 자체 서버 기록이 HTTP 400으로 거절됨 | 클라이언트·서버가 lib/affiliate-events.mjs의 동일 계약을 사용 |
| 하루특가 | food_deal_rail 역시 수신 API에서 거절됨 | 노출과 클릭 모두 동일 계약으로 수신 |
| 홈 숙소 기획전 | 노출은 home_stay, 클릭은 top으로 발신되어 같은 위치의 클릭률을 계산할 수 없고 home_stay 수신도 거절됨 | 노출·클릭을 home_stay로 통일 |
| 상품·여행 제휴 카드 | 묶음 전체를 관찰하고 일부만 보이면 모든 상품/제휴사 노출로 기록할 수 있었음 | 실제 카드별 관찰, 카드 면적 50% 이상 노출 시 기록 |
| 배너·하루특가의 관찰 콜백 | isIntersecting만 검사하여 설정한 threshold보다 적게 보여도 초기 콜백에서 노출로 집계될 수 있었음 | intersectionRatio를 함께 검사. 기존 배너 기준 35%, 카드 기준 50% 유지 |
| Beacon 전송 | sendBeacon이 예외를 던지면 fetch 대체 경로와 GA 이벤트 호출이 중단될 수 있었음 | 거절·미지원·예외 시 keepalive fetch 한 번. Beacon 큐 등록 성공 시 추가 fetch 없음 |
| 잘못된 이벤트 입력 | JSON 구문 오류가 서버 장애와 같은 503으로 반환됨 | 잘못된 JSON/계약 위반은 400, 기록 저장 실패는 503으로 구분 |

서버 기록 누락과 별개로 기존 gtag 호출은 별도 경로였다. GA4에서도 모두 누락되었다고 판단할 증거는 없다. [sendBeacon의 반환값](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)은 전송 큐 등록 여부이며 수신 API의 성공 응답을 뜻하지 않는다. 노출 면적 판정에는 [intersectionRatio](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry/intersectionRatio)를 사용했다.

## 보존한 상품·링크 정책

- 메인 고정 5상품: 어묵, 컵라면, 삼겹살, 순대, 커피. 다른 하루특가로 대체하지 않는다.
- 하루특가는 기존 동적 피드와 기존 만료·할인·식품 분류·토스 원본 링크 검사를 그대로 사용한다.
- 제휴 URL, 추적 파라미터, 상품 사진/광고 사진, 광고·AI 고지는 변경하지 않았다.
- 기존 자체 이벤트와 gtag만 사용한다. 새 이벤트 유형 purchase, 주문번호, 사용자 식별자, 이메일, 전화번호, 목적지 URL 저장을 추가하지 않았다.
- 기록 필드는 기존 at, event, provider, placement, page, 선택적 productId뿐이다. 추가 입력 필드는 버린다.
- 기존 출처 검사, 요청 크기 제한, 분당 요청 제한과 파일 크기 제한을 보존했다.
- 계측 변경 전후 수치는 수집 기준이 다르므로 단순 증감으로 광고 성과를 판단하면 안 된다.

## 검증

실행:

```text
node --test scripts/affiliate-events.test.mjs scripts/sharelink/winter-hero.test.mjs scripts/sharelink/top-deals.test.mjs scripts/sharelink/policy.test.mjs
node ../../node_modules/typescript/bin/tsc --noEmit --pretty false
```

- 전체 19개 테스트 통과.
- 실제 수신 route 코드를 로컬 임시 저장소에 실행: home_winter_hero, food_deal_rail, home_stay 각각 노출·클릭 총 6건이 HTTP 204로 수신되고 허용 필드만 저장됨.
- 알 수 없는 위치·이벤트, 잘못된 경로·상품번호, 잘못된 JSON, 외부 origin 거절 확인.
- Beacon 미지원/false/예외에서는 fetch 한 번, 성공에서는 추가 fetch 0번 확인.
- 고정 5상품 유지, 품절·만료·오래된 피드 제외, 하루특가 만료 경계와 원본 토스 링크 검사 등 기존 테스트 통과.
- TypeScript 검사 통과.
- 운영 서버의 이번 변경 배포와 실제 방문자 이벤트 수신 확인은 이 로컬 검증과 별도다.

## 수익 판단에 남은 확인

운영 반영 뒤 같은 위치·같은 기간의 노출 대비 외부 클릭을 확인해야 한다. hero와 rail은 노출 면적 기준이 달라 서로 직접 우열을 단정하지 않는다. 기기/방문자 식별 정보를 새로 수집하지 않았으므로 사용자별 전환율은 계산하지 않는다.

구매·수수료·취소·정산은 제휴사 보고서로 별도 확인해야 한다. 현재 기록은 상품 상세로 나가는 클릭까지이며, 외부 구매 성공을 확인하는 기능은 없다. 이번 수정의 확인 가능한 결과는 **계측 누락 복구와 노출·클릭 기준 정합성 개선**이다. 수익 증가나 검색 노출 증가가 입증된 상태는 아니다.
