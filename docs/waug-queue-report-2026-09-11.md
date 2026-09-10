# 와그 대기열 통합 결과 — 2026-09-11 KST

이번에는 등록·분류·예약·서버 연결만 반영했다. 새 글 0개, 새 이미지 0개, 즉시 발행 0개. 기존 글 30개 및 예약 시각·URL·제휴링크를 보존했다.

## 수량

| 항목 | 수 |
|---|---:|
| 영남권 원본 저장 / 실제 상품 ID 매칭 | 106 / 106 |
| 원본 중 동일 상품 링크 이력 보관 | 1 |
| 원본 중 실외 물놀이 제외 | 1 |
| 원본 나머지 104상품의 대표 장소 | 82 |
| 같은 장소 옵션·패키지 병합분 | 22 |
| 신규 자료 중 상품 조건 확인 대기 | 10상품 / 9곳 전체 보류 + 1곳 일부 옵션 보류 |
| 원래 목록 미작성 장소 | 39 (작성 예약 33 / 확인 대기 6) |
| 기존 작성 완료 | 30 (공개 20 / 기존 예약 10) |
| 전체 미발행 관리 대기열 | 131곳 |
| 날짜 배정 | 116곳 (기존 예약 10 + 신규 작성 예약 106) |
| 전체 확인 대기 | 15곳 |

82곳과 39곳은 미작성 후보이며 최종 승인 완료 수가 아니다. 상품별 최신 조사와 이미지 검수는 예약 실행 때 한다. 106개 신규 상품과 106곳 신규 작성 예약은 서로 다른 집계이며 우연히 숫자가 같다.

## 날짜별 편성

| 한국시간 날짜 | 합계 | 지역별 수 |
|---|---:|---|
| 2026-09-11 | 20 | 경기 10 · 경남 2 · 울산 1 · 경북 2 · 대구 2 · 부산 3 |
| 2026-09-12 | 20 | 경기 4 · 부산 4 · 대구 3 · 울산 2 · 경북 4 · 경남 3 |
| 2026-09-13 | 20 | 경기 6 · 경남 4 · 부산 4 · 경북 4 · 대구 2 |
| 2026-09-14 | 20 | 경기 8 · 경북 5 · 경남 3 · 부산 4 |
| 2026-09-15 | 20 | 경기 9 · 경북 9 · 부산 2 |
| 2026-09-16 | 15 | 경기 6 · 경북 9 |
| 2026-09-22 | 1 | 경남 1 |

9월 11일 20개는 이미 작성된 경기 예약 글 10개 + 신규 작성 후보 10개다. 9월 22일 고성 공룡 엑스포는 확인한 이용시작일에 맞췄다. 검수 실패·API 장애·서버 지연 시 미완성 글로 숫자를 채우지 않는다. 다른 종류 글도 당일 공개 수와 예약 점유를 공유하므로 20개가 배정된 날에는 신규 자동 발행이 대기하며, 데이터 수집은 유지된다.

## 개별 예외

- 133번 Ge7h2skQ는 상품 122728. 기존 KTz8pE8w 제휴링크 유지, 새 링크는 이력에 저장.
- 95/106/120번 대구 아쿠아리움은 한 장소 글에서 날짜지정권/일반권/After5 조건을 별도 관리.
- 163번 실외 물놀이는 제외. 190/189/122/111/107번은 혼합 물놀이 검증 전 보류.
- 199/197/194/112번 랜드마크 패키지는 포함 시설 대조 전 보류. 96번 경주월드 9월권은 날짜 옵션 확인 전 보류.
- 193번 2026-09-22~11-01, 127번 09-26까지, 132번 09-27까지, 101번 10-18까지의 확인된 유효기간을 저장. 실제 발행일에 다시 대조.
- 뮤직컴플렉스서울 부산점은 부산, 마산 로봇랜드는 경남 창원으로 분류.

## 서버 연결과 검증 범위

**최종 상태: 신규 서버 작성 활성화는 사용자 권한 승인 대기.** 모델 조회와 설치·규칙 사전 검증은 성공했지만, 실제 서버 편집기 점검에서 네트워크 인자와 공식 보호 규칙의 충돌을 발견했다. 공식 권한 프로필로 수정했으나 자동 승인 검토가 지속적인 CI 네트워크 권한 변경에 명시적 사용자 승인이 필요하다며 적용을 거부했다. 전체 도메인 허용을 제거한 제한 목록도 같은 이유로 거부됐다. 따라서 신규 `waug-editorial.yml`은 `disabled_manually`로 중지했고 기존 `waug.yml` 예약 발행은 `active`로 유지했다. 아래 05:00/08:00은 구성된 시간이며, 승인 후 활성화해야 실제 신규 작성이 시작된다.

- `.github/workflows/waug-editorial.yml`: 매일 KST 05:00 조사·작성, 08:00 이어서 처리. 최초 배정 2026-09-11 05:00이었으나 현재 승인 대기라 실행되지 않는다. GitHub 예약은 정확한 분 단위 실행을 보장하지 않는다.
- 기존 공개 처리 워크플로는 KST 06:00/07:00 유지. 편집 실행은 45분 제한, 중단 시 원격 단계 저장. 모든 글 작업은 공통 동시 실행 그룹을 사용한다.
- GitHub OPENAI_API_KEY 서버 비밀값으로 gpt-image-2 및 gpt-5.6-luna 모델 조회 HTTP 200. 비밀값을 새로 노출하거나 로컬 키 파일을 서버에 복사하지 않았다.
- 사전 검증 실행: https://github.com/seojungseok/free-culture/actions/runs/34497528025 — 성공, generationCalls=0. Chromium·한글폰트·Sharp 설치 및 규칙 테스트 성공.
- 예약 전체 생성→실제 이미지 품질 검수→발행 경로의 첫 실전 실행은 아직 하지 않았다. 이 보고서는 이를 성공 완료로 주장하지 않는다.
- 단계별 상태와 이미지 과금 요청을 GitHub에 먼저 저장한다. 결과 불명확 요청은 자동 재생성하지 않고 복구 대기로 남긴다. 장소 작업 시도는 3회 상한.
- 로컬 Codex 예약 20번은 중복 실행 방지를 위해 PAUSED. 필수 조치: 준비된 제한 네트워크 CI 권한 프로필의 적용을 사용자 승인해야 한다. GitHub Actions/API 결제 잔액·권한·Vercel 연결은 유지되어야 한다.
- 4f16ab4의 Vercel 배포 성공 확인. 이번 작업의 공개 글 데이터는 변경 없음.

## 승인할 정확한 변경 범위

로컬에 준비된 .github/waug-codex-config.toml과 .github/workflows/waug-editorial.yml의 미커밋 변경만 승인 대상이다. 전체 도메인 허용과 로컬 바인딩 허용 옵션은 제거했다.

- 접속 허용: www.waug.com, waug.com, d2mgzmtdeipcjp.cloudfront.net, mwohaji.kr, www.mwohaji.kr, apis.data.go.kr, tong.visitkorea.or.kr, www.kogl.or.kr, 127.0.0.1, localhost.
- 로컬 주소는 서버 내부 이미지·체크포인트 서비스와 상세 화면 검증에 쓴다.
- 기본 workspace 보호를 유지하며 scripts/.github/docs/app/components/lib와 발행 정책 파일은 읽기 전용이다.
- 코드 변경·정책 완화·임의 외부 도메인 접근을 허용하지 않는다. 임의 시설 공식 사이트는 웹 검색 도구로 확인하고, 허용되지 않은 외부 사진은 직접 가져오지 않는다.
- 승인 후 이 설정을 GitHub에 적용하고 생성 없는 연결 점검을 통과한 뒤 서버 예약만 다시 활성화한다.

## 이미지·비용

서로 다른 썸네일 1장과 본문 최소 2장, 본문 내 실제 분산 배치가 공개 조건이다. 정상 기존 썸네일은 재사용한다. 새 썸네일은 gpt-image-2, medium, 1536×1024 생성 후 1200×630 JPEG로 압축하고 같은 주소를 대표·목록·OG에서 쓴다. 권리·얼굴·장소 일치가 확인된 제공 사진을 우선하며 필요한 경우에만 본문 AI 일러스트를 보완한다.

이미지 출력 예상은 장당 약 $0.041, 썸네일 20장 약 $0.82다. 입력 토큰·본문 보완 이미지·조사/작성 모델·검색·서버 비용은 별도이며 청구 확정액이 아니다. 이번 작업의 이미지 생성 호출은 0회다. 근거: https://developers.openai.com/api/docs/guides/image-generation#calculating-costs

## 106개 원본 매핑

| 번호 | 원본 장소명 | 상품 ID | 지역 | 대표 장소 | 제휴 링크 | 처리 / 예정일 |
|---:|---|---|---|---|---|---|
| 200 | 경남 마산 로봇랜드 종일권 + 로봇스쿨 레이싱카 패키지 | 148676 | 경남 | masan-robotland | https://www.waug.com/r/rHuA7c9p | 2026-09-11 |
| 199 | 경주 랜드마크 패키지 | 148612 | 경북 | place-148612 | https://www.waug.com/r/8XFuDrFK | 조건 확인 대기 |
| 198 | 부산 영화체험박물관 & 씨네뮤지엄 입장권 | 148437 | 부산 | place-148437 | https://www.waug.com/r/zrHyPXgl | 2026-09-12 |
| 197 | 대구 랜드마크 패키지 | 148416 | 대구 | place-148416 | https://www.waug.com/r/eqCzQqN6 | 조건 확인 대기 |
| 196 | 경남 통영 더카트인 카트 1회 + 케이블카 왕복 패키지 | 147333 | 경남 | tongyeong-cablecar | https://www.waug.com/r/LazkVUgr | 2026-09-13 |
| 195 | 경주 헬로마이디노 & VR 테마파크 입장권 | 144233 | 경북 | place-144233 | https://www.waug.com/r/CVtBkM9v | 2026-09-16 |
| 194 | 경북 청도 랜드마크 패키지 | 143543 | 경북 | place-143543 | https://www.waug.com/r/E5rnYR9V | 조건 확인 대기 |
| 193 | 2026 경남 고성 공룡 세계 엑스포 입장권 | 141862 | 경남 | place-141862 | https://www.waug.com/r/unZksy0D | 2026-09-22 |
| 192 | 대구 히어로플레이파크 상인점 소인 입장권 | 138379 | 대구 | place-138379 | https://www.waug.com/r/9Z9hQ9QJ | 2026-09-12 |
| 191 | 경주 쉼 족욕카페 황리단점 입장권 + 음료 패키지 | 137362 | 경북 | place-137362 | https://www.waug.com/r/2pThdfbM | 2026-09-14 |
| 190 | 부산 기장 하이리페움 수영장 입장권 | 136861 | 부산 | gijang-highlifeum | https://www.waug.com/r/LC7TFFb6 | 조건 확인 대기 |
| 189 | 경남 소노캄 거제 오션어드벤처 종일권 | 136701 | 경남 | place-136701 | https://www.waug.com/r/OlYD8ith | 조건 확인 대기 |
| 188 | 경주 코오롱호텔 야외 방탈출 ‘사라진 시계’ | 133292 | 경북 | place-133292 | https://www.waug.com/r/y5PRRYvB | 2026-09-16 |
| 187 | 경북투어패스 서부권 | 132011 | 경북 | gyeongbuk-tourpass | https://www.waug.com/r/fMXlR7SQ | 2026-09-14 |
| 186 | 경북투어패스 남부권 | 131885 | 경북 | gyeongbuk-tourpass | https://www.waug.com/r/0kKuK9af | 2026-09-14 |
| 185 | 포항 야외 방탈출 ‘별의 기억1’ | 131524 | 경북 | place-131524 | https://www.waug.com/r/Lm2lrnjW | 2026-09-16 |
| 184 | 울산 야외 방탈출 ‘울산 골목의 신비한 시간 여행’ 잔상일지 | 131522 | 울산 | place-131522 | https://www.waug.com/r/6oXOEhNd | 2026-09-12 |
| 183 | 포항 야외 방탈출 ‘시간여행자 포항 장기유배촌의 비밀’ 잔상일지 | 131505 | 경북 | place-131505 | https://www.waug.com/r/i2Y6afYw | 2026-09-16 |
| 182 | 경주 야외 방탈출 ‘시간이 쌓인 경주에서의 단상’ 잔상일지 | 131502 | 경북 | place-131502 | https://www.waug.com/r/0KBJtcMu | 2026-09-16 |
| 181 | 포항 호미곶 광장 야외 방탈출 ‘꺼지지 않는 불빛 호미곶 그곳’ | 131499 | 경북 | place-131499 | https://www.waug.com/r/fJThFTkj | 2026-09-16 |
| 180 | 경남 하동 케이블카 탑승권 | 130855 | 경남 | place-130855 | https://www.waug.com/r/mEFt2pOH | 2026-09-14 |
| 179 | 경북 상주 국립 낙동강 생물자원관 입장권 | 123046 | 경북 | place-123046 | https://www.waug.com/r/j1piBH0a | 2026-09-15 |
| 178 | 경북 경산 백자산온천 사우나 & 노천탕 이용권 | 119861 | 경북 | place-119861 | https://www.waug.com/r/c2TCJlr1 | 2026-09-13 |
| 177 | 경남 거제 벨버디어 사우나 입장권 | 119801 | 경남 | place-119801 | https://www.waug.com/r/7G0Au5an | 2026-09-11 |
| 176 | 경주 바니베어 뮤지엄 입장권 | 118075 | 경북 | place-118075 | https://www.waug.com/r/uwTNHezC | 2026-09-12 |
| 175 | 경북 영주 소백산풍기온천리조트 온천 입장권 | 117886 | 경북 | place-117886 | https://www.waug.com/r/xfdZSQsr | 2026-09-13 |
| 174 | 청도 프로방스 입장권 + 썰매 패키지 | 117324 | 경북 | cheongdo-provence | https://www.waug.com/r/JIAa0zKJ | 2026-09-14 |
| 173 | 경북투어패스 프리미엄권 24시간 | 117296 | 경북 | gyeongbuk-tourpass | https://www.waug.com/r/uyGT91LI | 2026-09-14 |
| 172 | 경남 진주 타이거펀치 키즈랜드 입장권 | 106170 | 경남 | place-106170 | https://www.waug.com/r/LbnaAh36 | 2026-09-12 |
| 171 | 부산 해운대 씨라이프 아쿠아리움 & 브릭맨 시티즈 원더월드 입장권 | 103711 | 부산 | place-103711 | https://www.waug.com/r/OWdjufF1 | 2026-09-14 |
| 170 | 경남 통영 케이블카 왕복 + 디피랑·어드벤처타워 패키지 | 144734 | 경남 | tongyeong-cablecar | https://www.waug.com/r/P6Xz6CDX | 2026-09-13 |
| 169 | 경남 마산 로봇랜드 커플 & 패밀리 입장권 — 2·3·4·6인권 | 143373 | 경남 | masan-robotland | https://www.waug.com/r/ENtQOkUN | 2026-09-11 |
| 168 | 경북 칠곡 러키더키 패밀리랜드 — 아쿠아리움 & 수목원 | 142556 | 경북 | place-142556 | https://www.waug.com/r/Vfe8knWE | 2026-09-16 |
| 167 | 부산 기장 하이리페움 아이스포츠파크 입장권 | 136688 | 부산 | gijang-highlifeum | https://www.waug.com/r/jz3Ys499 | 2026-09-13 |
| 166 | 경북투어패스 북부권 | 131890 | 경북 | gyeongbuk-tourpass | https://www.waug.com/r/AHKnKfj5 | 2026-09-14 |
| 165 | 경북투어패스 통합권 | 122962 | 경북 | gyeongbuk-tourpass | https://www.waug.com/r/LibPUzsW | 2026-09-14 |
| 164 | 안동투어패스 48시간권 | 120838 | 경북 | place-120838 | https://www.waug.com/r/FMUxpCNX | 2026-09-15 |
| 163 | 경남 합천 풀헤븐워터파크 수상레저 이용권 | 120595 | 경남 | place-120595 | https://www.waug.com/r/wRE81lXN | 제외 |
| 162 | 대구 이월드 체험패키지 — 83전망대·주주팜·교복·판다전시 | 118117 | 대구 | daegu-eworld | https://www.waug.com/r/gFafik0z | 2026-09-12 |
| 161 | 대구 이월드 연간회원권 | 117770 | 대구 | daegu-eworld | https://www.waug.com/r/uI7z2VfT | 2026-09-12 |
| 160 | 경주 한국대중음악 박물관 입장권 | 116324 | 경북 | place-116324 | https://www.waug.com/r/ZCBHDP90 | 2026-09-12 |
| 159 | 경주 키덜트뮤지엄 입장권 | 110100 | 경북 | place-110100 | https://www.waug.com/r/xLxIizik | 2026-09-12 |
| 158 | 청도 프로방스 입장권 | 103995 | 경북 | cheongdo-provence | https://www.waug.com/r/CpAzdIrl | 2026-09-14 |
| 157 | 경남 통영 히어로 스튜디오 통통 입장권 | 104077 | 경남 | place-104077 | https://www.waug.com/r/UJgob0o9 | 2026-09-14 |
| 156 | 경북 청도 용암온천 가족탕 이용권 | 119637 | 경북 | cheongdo-yongam-spa | https://www.waug.com/r/O3wxYmiQ | 2026-09-12 |
| 155 | 잭슨나인스 대구점 입장권 | 117366 | 대구 | place-117366 | https://www.waug.com/r/IF0gTfK4 | 2026-09-13 |
| 154 | 경주 동궁원 입장권 | 122172 | 경북 | place-122172 | https://www.waug.com/r/1HwoOPsa | 2026-09-15 |
| 153 | 부산 송도해상케이블카 + 카페 오션뷰 패키지 | 116937 | 부산 | busan-songdo-cablecar | https://www.waug.com/r/1FBc8mXE | 2026-09-14 |
| 152 | 대구 이월드 83타워 전망대 + 판다100 전시 패키지 | 139519 | 대구 | daegu-eworld | https://www.waug.com/r/N8QPazFX | 2026-09-12 |
| 151 | 경북 영천 야외 방탈출 ‘별의기억1.5 : 시간이탈자’ — 키트 택배발송 | 135086 | 경북 | place-135086 | https://www.waug.com/r/tsljZnRp | 2026-09-16 |
| 150 | 부산 송도해상케이블카 + EL16.52 패키지 | 131837 | 부산 | busan-songdo-cablecar | https://www.waug.com/r/CGE6MGnE | 2026-09-14 |
| 149 | 경남 창원 잭슨나인스 입장권 | 121133 | 경남 | place-121133 | https://www.waug.com/r/HY4vuPj1 | 2026-09-13 |
| 148 | 경주 라원 미디어아트 복합문화정원 입장권 | 120090 | 경북 | place-120090 | https://www.waug.com/r/BIPlpb9s | 2026-09-15 |
| 147 | 경남 거제 벨버디어 뽀로로 키즈카페 이용권 | 117783 | 경남 | place-117783 | https://www.waug.com/r/Ej3qRywm | 2026-09-12 |
| 146 | 경주 야외 방탈출 ‘물오름달 열닷새’ | 120959 | 경북 | place-120959 | https://www.waug.com/r/izeQEeCl | 2026-09-15 |
| 145 | 부산 송도 해상케이블카 & 부산타워 패키지 | 110661 | 부산 | busan-songdo-cablecar | https://www.waug.com/r/vftupAg8 | 2026-09-14 |
| 144 | 경남 거제파노라마 케이블카 티켓 | 119559 | 경남 | place-119559 | https://www.waug.com/r/VOJkrlK3 | 2026-09-14 |
| 143 | 대구 이월드 83타워 전망대 패키지 | 103905 | 대구 | daegu-eworld | https://www.waug.com/r/kXcP6533 | 2026-09-12 |
| 142 | 창원투어패스 24시간권 | 146311 | 경남 | place-146311 | https://www.waug.com/r/PsNlPcDV | 2026-09-13 |
| 141 | 경남 마산 로봇랜드 종일권 + 공룡월드 패키지 | 143087 | 경남 | masan-robotland | https://www.waug.com/r/Pfi2PUXD | 2026-09-11 |
| 140 | 경주 원더스페이스 보문점 입장권 | 138344 | 경북 | place-138344 | https://www.waug.com/r/Te8Gn700 | 2026-09-16 |
| 139 | 캐니언파크 울산점 입장권 | 130516 | 울산 | place-130516 | https://www.waug.com/r/xEF6tr6X | 2026-09-11 |
| 138 | 경주 히어로플레이파크 경주점 소인 입장권 | 129420 | 경북 | place-129420 | https://www.waug.com/r/djAugGUY | 2026-09-11 |
| 137 | 부산 해운대 스파마린 입장권 | 119853 | 부산 | place-119853 | https://www.waug.com/r/FExWanil | 2026-09-12 |
| 136 | 부산 기장 하이리페움 온천 사우나 입장권 | 136864 | 부산 | gijang-highlifeum | https://www.waug.com/r/eV38aOrw | 2026-09-13 |
| 135 | 경남 김해 가야랜드 입장권 | 117002 | 경남 | place-117002 | https://www.waug.com/r/8sTUimvP | 2026-09-13 |
| 134 | 히어로플레이파크 대구침산점 입장권 | 132697 | 대구 | place-132697 | https://www.waug.com/r/ctIsOast | 2026-09-11 |
| 133 | 히어로 플레이파크 입장권 — 전국 6개 지점 이용 가능 | 122728 | 확인 대기 | place-122728 | https://www.waug.com/r/Ge7h2skQ | 기존 링크 이력 |
| 132 | 대구 엑스코 상상체험 키즈월드 입장권 | 117699 | 대구 | place-117699 | https://www.waug.com/r/BDkEsnfa | 2026-09-11 |
| 131 | 부산타워 전망대 입장권 | 120930 | 부산 | place-120930 | https://www.waug.com/r/aXoOkaDi | 2026-09-14 |
| 130 | 대구 네이처파크 이용권 | 117267 | 대구 | place-117267 | https://www.waug.com/r/5vXZxkD7 | 2026-09-13 |
| 129 | 경주 정글 미디어 파크 & 포토 테마파크 통합 입장권 | 118660 | 경북 | place-118660 | https://www.waug.com/r/Oj6qZc7T | 2026-09-14 |
| 128 | 경주 또봇정크아트 뮤지엄 입장권 — 엑스포대공원 포함 | 120484 | 경북 | gyeongju-expo-park | https://www.waug.com/r/Hs4TqPSb | 2026-09-11 |
| 127 | 부산 센텀 해운대 뮤지엄 원 ‘다시, 낭만의 시대’ 전시 티켓 | 119561 | 부산 | place-119561 | https://www.waug.com/r/iKyl0WUZ | 2026-09-11 |
| 126 | 부산 키자니아 입장권 | 147318 | 부산 | place-147318 | https://www.waug.com/r/0albnuBE | 2026-09-14 |
| 125 | 창원 마산 로봇랜드 종일·오후 입장권 | 138629 | 경남 | masan-robotland | https://www.waug.com/r/lumJv16l | 2026-09-11 |
| 124 | 부산 기장 키위키즈랜드 입장권 | 141327 | 부산 | place-141327 | https://www.waug.com/r/zWOkcJrg | 2026-09-13 |
| 123 | 대구 이월드 83타워 아이스링크장 입장권 | 107462 | 대구 | daegu-eworld | https://www.waug.com/r/onins2gc | 2026-09-12 |
| 122 | 경남 김해 장유스파랜드 이용권 — 스파·사우나 + 워터파크 | 118551 | 경남 | place-118551 | https://www.waug.com/r/jbgtpTms | 조건 확인 대기 |
| 121 | 경북 청도 군파크 루지 & 스카이 리프트 패키지 | 118033 | 경북 | place-118033 | https://www.waug.com/r/98LCdMZ7 | 2026-09-15 |
| 120 | 대구 신세계 아쿠아리움 AFTER5 입장권 | 148389 | 대구 | daegu-shinsegae-aquarium | https://www.waug.com/r/NLSJid0b | 2026-09-12 |
| 119 | 포항 앨리스파파 키즈파크 입장권 | 120397 | 경북 | place-120397 | https://www.waug.com/r/RkjGdfIW | 2026-09-13 |
| 118 | 경주 더케이호텔 스파월드 입장권 | 119740 | 경북 | place-119740 | https://www.waug.com/r/HnRD4oPk | 2026-09-13 |
| 117 | 울릉아일랜드 투어패스 | 120110 | 경북 | place-120110 | https://www.waug.com/r/22RRSLjT | 2026-09-15 |
| 116 | 주렁주렁 실내 동물원 경주점 입장권 | 103712 | 경북 | place-103712 | https://www.waug.com/r/CDyoWrhK | 2026-09-14 |
| 115 | 경북 청도 용암온천 스파 입장권 | 117912 | 경북 | cheongdo-yongam-spa | https://www.waug.com/r/F9Nuf2g4 | 2026-09-12 |
| 114 | 부산 아르떼뮤지엄 + 씨라이프부산아쿠아리움 패키지 | 148264 | 부산 | busan-arte-museum | https://www.waug.com/r/sFvgr7bD | 2026-09-11 |
| 113 | 부산 아르떼뮤지엄 입장권 | 139416 | 부산 | busan-arte-museum | https://www.waug.com/r/FtUM2T63 | 2026-09-11 |
| 112 | 부산 랜드마크 패키지 | 145594 | 부산 | place-145594 | https://www.waug.com/r/PLzDXH4f | 조건 확인 대기 |
| 111 | 경주 한화리조트 뽀로로아쿠아빌리지 입장권 | 123151 | 경북 | place-123151 | https://www.waug.com/r/Sd8mjHtJ | 조건 확인 대기 |
| 110 | 부산 기장 스카이라인 루지 이용권 | 120453 | 부산 | place-120453 | https://www.waug.com/r/1YSKjEDy | 2026-09-13 |
| 109 | 부산 서면 런닝맨 & 다이나믹메이즈 입장권 패키지 | 119433 | 부산 | place-119433 | https://www.waug.com/r/a9yDUfKa | 2026-09-15 |
| 108 | 부산 엑스더스카이 엘시티 전망대 입장권 | 116786 | 부산 | place-116786 | https://www.waug.com/r/wxbzaiuw | 2026-09-13 |
| 107 | 부산 해운대 엘시티 클럽디 오아시스 통합권·스파·워터파크 이용권 | 132016 | 부산 | place-132016 | https://www.waug.com/r/uQPn77nn | 조건 확인 대기 |
| 106 | 대구 신세계 아쿠아리움 입장권 | 148388 | 대구 | daegu-shinsegae-aquarium | https://www.waug.com/r/XBsrt131 | 2026-09-12 |
| 105 | 경북 문경투어패스 48시간권 | 124023 | 경북 | place-124023 | https://www.waug.com/r/r7coJoJz | 2026-09-15 |
| 104 | 부산투어패스 프리패스 자유이용권 | 119521 | 부산 | place-119521 | https://www.waug.com/r/5hzr9xck | 2026-09-15 |
| 103 | 경남 거제 씨월드 입장권 | 105855 | 경남 | place-105855 | https://www.waug.com/r/mGWSjRk4 | 2026-09-12 |
| 102 | 울산 자수정 동굴나라 입장권 — 보트 탐험 포함 | 121492 | 울산 | place-121492 | https://www.waug.com/r/Iez1tnrF | 2026-09-12 |
| 101 | 부산 해운대 벡스코 상상체험 키즈월드 입장권 | 117258 | 부산 | place-117258 | https://www.waug.com/r/nE2r944x | 2026-09-12 |
| 100 | 부산 해운대 센텀 스파랜드 입장권 | 118762 | 부산 | place-118762 | https://www.waug.com/r/w4Eh4SqA | 2026-09-12 |
| 99 | 경주 신라투어패스 | 117293 | 경북 | place-117293 | https://www.waug.com/r/VEmRs5my | 2026-09-15 |
| 98 | 뮤직컴플렉스서울 부산점 — WAUG Exclusive | 140381 | 부산 | place-140381 | https://www.waug.com/r/WRTv1vxE | 2026-09-11 |
| 97 | 경주 엑스포대공원 입장권 | 120082 | 경북 | gyeongju-expo-park | https://www.waug.com/r/Jlmt4oJC | 2026-09-11 |
| 96 | 경주월드 9월 자유이용권 — 종일권·오후권·야간권 | 110561 | 경북 | place-110561 | https://www.waug.com/r/0W8QChE8 | 조건 확인 대기 |
| 95 | 대구 신세계 아쿠아리움 입장권 | 142465 | 대구 | daegu-shinsegae-aquarium | https://www.waug.com/r/2wDe1CLW | 2026-09-12 |
