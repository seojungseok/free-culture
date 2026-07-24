# 주말에뭐하지 (free-culture)

전국의 **무료·저렴한 전시·공연·문화행사**를 가격·지역·분야·대상·시기로 찾는 화보형 정보 사이트.
공공데이터포털(한국문화정보원) 공연전시정보조회서비스를 매일 자동 수집해 정적 페이지로 서빙합니다.

- **가격 5분류**: 무료 / 조건부 무료 / 1만원 이하 / 유료 / 요금 확인 — 탭으로 즉시 구분(URL 반영)
- **조건부 무료가 무기**: "만 65세 이상 무료" 같은 무료 조건을 카드에 직접 표시
- **대상별 큐레이션**: 아이와 함께 / 어르신 / 연인 / 혼자 / 단체 태깅
- **시기별**: 이번 주말 / 곧 종료(D-7) / 곧 시작
- **검색**: 행사명·장소·지역 클라이언트 검색(`/search?q=`)
- **큰 행사 자동 팝업**: 접속 시 대형 공연/전시를 모달로 노출 (하루 1회)
- **화보형 그리드**: 포스터 중심, hover 확대, 스켈레톤·대체 이미지
- **SEO**: 페이지별 메타/OG, JSON-LD(Event), sitemap.xml / robots.txt 자동 생성
- **DB 없음**: 수집 결과를 `data/events.json` 으로 저장해 정적 서빙
- 문의·제보 이메일: **tjwjdtjr11@naver.com**

---

## 1. 로컬 실행

```bash
npm install
```

`.env.local` 에 공공데이터포털 인증키(Decoding) 설정:

```
DATA_GO_KR_KEY=발급받은_인증키
```

데이터 수집 → 개발 서버:

```bash
npm run collect     # data/events.json 생성/갱신
npm run dev         # http://localhost:3000
```

### 수집 옵션(환경변수)

| 변수 | 기본값 | 설명 |
|---|---|---|
| `COLLECT_DAYS` | 60 | 오늘부터 N일 이내 행사 수집 |
| `COLLECT_MAX` | 2000 | 상세조회(detail2) 최대 호출 수(트래픽 안전장치) |
| `COLLECT_SIDO` | (없음) | 특정 시도만 수집 (예: `서울`) — 최초 분할 수집용 |
| `COLLECT_CONCURRENCY` | 8 | 상세조회 동시 요청 수 |

> API 페이지네이션은 대소문자까지 정확해야 동작합니다: **`PageNo`**, **`numOfrows`**.
> 목록은 100건씩 페이징하고, **신규 항목만** 상세조회해 트래픽을 절약합니다(일 10,000 한도).

---

## 2. 가격 판별 규칙 (5분류)

`lib/classify.js` 의 `analyzePrice()` 한 곳에서 관리합니다. `만/천/억` 단위와
최저·최고가(`priceMin`/`priceMax`), 무료 조건(`freeCondition`)까지 추출합니다.

| 구분 | 조건 |
|---|---|
| `free` | 무료 표현 있고 금액·제한조건 없음 |
| `partial_free` | 금액과 "무료"가 공존, 또는 무료가 특정 대상/시기 한정 → **무료 조건 문구 저장** |
| `cheap` | 유료지만 최고가 10,000원 이하 |
| `paid` | 최고가 10,000원 초과 |
| `unknown` | 요금 정보 없음/"미정" 등 |

> 대상 태깅은 `computeAudiences()`(제목·분야·무료조건 키워드 매칭)에서 관리합니다.

---

## 3. 배포 (Vercel)

1. GitHub 저장소 `seojungseok/free-culture` 에 푸시
2. Vercel → **Import Project** → 이 저장소 선택 (Next.js 자동 감지)
3. **Environment Variables** 에 `DATA_GO_KR_KEY` 추가
4. Deploy

### 매일 자동 갱신 (핵심)

Vercel 서버리스는 런타임에 파일을 쓸 수 없으므로, **GitHub Actions**로 매일 새벽 수집 →
`data/events.json` 커밋 → Vercel이 자동 재배포하는 구조입니다.

- 워크플로: [`.github/workflows/collect.yml`](.github/workflows/collect.yml) (매일 05:00 KST)
- GitHub 저장소 → **Settings → Secrets and variables → Actions** 에
  `DATA_GO_KR_KEY` 시크릿 등록 필요
- Actions 탭에서 **수동 실행(Run workflow)** 도 가능

---

## 4. 애드센스

- 광고 자리는 `components/AdSlot.tsx` 로 잡아두었고 **승인 전까지 비어 있습니다**.
- 승인 후 `AdSlot` 안에 광고 스크립트를 넣고, 미리보기용으로는
  `NEXT_PUBLIC_SHOW_AD_SLOTS=1` 로 자리 표시를 켤 수 있습니다.
- 심사 필수 페이지(`/about`, `/privacy`, `/terms`, `/contact`) 포함,
  개인정보처리방침에 AdSense 쿠키 안내 포함.

---

## 5. 폴더 구조

```
app/            페이지(홈·지역·분야·상세·주말·아이·정적) + sitemap/robots
components/     Header, Footer, PosterCard, FilterableGrid, BigEventModal ...
lib/            classify.js(판별·코드), data.ts(로딩), format.ts, site.ts, types.ts
scripts/        collect.mjs (데이터 수집)
data/           events.json (수집 결과 — 자동 생성/갱신)
```

출처: 공공데이터포털 (한국문화정보원)
