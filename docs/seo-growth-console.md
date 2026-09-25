# Search Console 기반 기존 페이지 개선 순서

Search Console에서 같은 검색 유형과 국가 조건으로 페이지별 CSV를 최근 28일, 직전 28일, 최근 7일로 내보냅니다. `Page, Clicks, Impressions, CTR, Position` 또는 대응하는 한국어 열 이름을 사용합니다. 페이지와 검색어를 함께 내보낸 표라면 `Query` 열도 분석합니다. CSV는 로컬에만 보관하고 저장소에 커밋하지 않습니다.

```sh
node scripts/seoGrowthReport.mjs --last28 current-28.csv --previous28 previous-28.csv --last7 recent-7.csv
```

결과의 A는 노출 100 이상·CTR 3% 미만·평균순위 20위 이내, B는 노출 50 이상·8~30위, C는 직전 기간 대비 클릭 25% 이상 증가, D는 노출 25% 이상 감소입니다. 수치는 작업 후보를 좁히는 운영 기준이며 Google의 순위 기준이 아닙니다. 각 URL의 실제 검색어와 본문을 읽고 제목·설명, 최신 정보, 관련 내부 링크를 수정합니다. 자료가 없으면 우선순위나 방문자 증가를 추정하지 않습니다.
