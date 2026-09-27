# mwohaji.kr NAS 이전 기록

이 문서는 `khyun-studio/free-culture`만 대상으로 한다. `bannerpick`, `myeongeon-story`는 변경하지 않는다. **현재 상태: NAS LAN 시험 배포·대표 기능 검사·공유 폴더 백업 및 격리된 파일 복원 완료. 비밀 환경변수 이전, 자동 발행 갱신, 터널, 도메인 전환, 48시간 검증, Vercel 삭제는 미완료.** 검증되지 않은 단계를 완료로 표시하지 않는다.

## 2026-09-27 이전 기준

- GitHub `seojungseok/free-culture`의 `main`은 `7c438335d5d520ac2438caa7a6cba804acca3383`. 기존 로컬 작업 폴더는 수정 중이므로 별도 `codex/nas-migration` 작업본을 사용한다.
- Vercel `khyun-studio/free-culture`의 Production은 같은 커밋이며 `mwohaji.kr`과 `free-culture.vercel.app`에 연결돼 있다. 삭제하지 않았다.
- 공개 홈과 `/events`, `/places`, `/course`, `/camping`, `/food`, `/pet-travel`, `/city-tour`, `/weekend-prep`, `/search`, `/robots.txt`, `/sitemap.xml`은 HTTP 200. 공개 사이트맵 URL 12,516개. 사이트맵 SHA-256: `F99FB7E8E5D484566744D23D8F62B09805A7A5CED5D438D19F2B9999F39EB965`.
- `mwohaji.kr`의 권한 있는 NS는 가비아 3개(`ns.gabia.net`, `ns.gabia.co.kr`, `ns1.gabia.co.kr`). 가비아 관리 화면에서 확인한 레코드 전체는 루트 A `216.198.79.1`(TTL 1800), `www`의 Vercel CNAME(TTL 600), 루트 검색엔진 소유권 TXT(TTL 600) 3개다. MX 레코드는 없다. Cloudflare 무료 영역에는 동일한 3개를 가져와 DNS-only 상태로 보관했지만 권한 NS는 여전히 가비아다. 온보딩 보호 경고 단계에서 멈췄고 **도메인 전환은 하지 않았다**.
- NAS DS1821+의 RAM은 사용자 확인 기준 20GB. `/volume1/projects/free-culture/app`에 정리된 앱 소스와 Secret이 없는 `runtime/app.env`를 두고 Container Manager 프로젝트 `free-culture-nas`로 LAN 바인딩 `192.168.0.115:3275`에 실행했다. 기존 Vercel은 그대로 운영 중이다.
- 운영 디스크 1·2의 `projects` 공유 폴더는 기존 Hyper Backup의 매일 03:00 작업 대상이다. 2026-09-27 22:06 수동 백업 성공 후 백업 탐색기에서 `free-culture/app/Dockerfile.nas`를 선택해 `/volume1/projects/free-culture/restore-check-20260927/Dockerfile.nas`로 복원했다. File Station에서 복원 파일 1.1KB와 원본 수정시각을 확인했다. 바이트/해시 비교는 아직 수행하지 않았다. 디스크 3·4는 같은 NAS의 `/volume2/backup`이므로 오프사이트 백업을 대체하지 않는다.

## 앱 특성 및 시험 구성

- Next.js 15 App Router의 동적 API, 서버 렌더링, ISR, `/_next/image`가 있으므로 정적 파일 복사로는 이전할 수 없다. 단일 Node.js 서버로 시작하고 `.next/cache`는 Docker 볼륨으로 지속한다. 여러 인스턴스를 띄우지 않는다.
- 서버 API는 `/api/nearby`, `/api/parking/realtime`, `/api/pet-travel`, `/api/revalidate`, `/api/traditional-markets`다. 외부 API 키를 사용하는 기능은 비밀값을 NAS 런타임에 안전하게 옮긴 뒤 재검사한다. API 키를 이미지·저장소·로그에 넣지 않는다.
- `data/*.json`과 `public/`은 빌드 이미지에 포함된다. 데이터 변경은 **새 이미지 빌드 후 교체**해야 보인다. GitHub Actions는 현재 매일 05:00 KST와 매주 월요일 03:00 KST에 수집·발행하여 GitHub `main`에 커밋한다. NAS에서 같은 수집·발행을 중복 실행하지 않는다. 자동 이미지 갱신 체계가 준비될 때까지 현재 GitHub 발행은 유지하고 NAS에서는 읽기/빌드만 수행한다.
- `Dockerfile.nas`와 `compose.nas.yml`은 LAN 주소 `192.168.0.115:3275`에서만 시험한다. 공유기 포트 포워딩은 추가하지 않는다. 실제 공개는 별도 Cloudflare Tunnel을 사용한다.
- 로컬 Windows에서 `NAS_STANDALONE=1` 빌드와 Node 단일 서버 실행을 확인했다. 이어 NAS의 Docker에서 같은 빌드가 성공했고 홈·주요 목록·검색·robots·sitemap·`/api/pet-travel`·`/api/nearby`·원본 및 최적화 이미지가 HTTP 200이었다. 컨테이너는 메모리 상한 4GB, 자동 재시작이며, 시험 중 Next 프로세스는 약 355MB였다. DSM 전체 자원 표시는 유휴 시 CPU 약 13~16%, RAM 5%였다.
- 로컬 NAS 형식 빌드의 사이트맵은 12,516개 URL이며 공개 운영본과 SHA-256이 정확히 일치했다. 로컬 체크아웃이 상위 프로젝트 안에 있어 ESLint 설정 충돌 경고가 났지만, Next.js 컴파일·TypeScript 검사·빌드 자체는 종료 코드 0이었다. NAS의 독립 경로 빌드에서 린트 경고 재검사 필요.
- `scripts/testSeoHttp.mjs`를 NAS 형식 로컬 서버에 실행해 96개 URL 검사 실패 0, 의도한 404 응답, 외부 원본 이미지 16개 HTTP 206 및 이미지 MIME을 확인했다. 첫 실행의 이미지 연결 오류는 제한된 네트워크에서 발생했고 정상 네트워크 재검사에서 전부 통과했다.
- 같은 검사기를 NAS LAN 서버에 적용해 대표 URL 96개 실패 0, 외부 원본 이미지 16개 HTTP 206을 확인했다. NAS 사이트맵은 공개 Vercel 사이트맵과 12,516개 URL 및 SHA-256이 일치한다. 대표 상세의 canonical은 기존 `https://mwohaji.kr/event/383591`, JSON-LD 두 블록이 있다. 브라우저 콘솔 오류는 없고 320·360·375·390·430px에서 가로 넘침은 없었다. 보관함 저장·새로고침 후 유지·삭제를 NAS 시험 주소에서 확인했다.
- 낮은 부하의 LAN 측정: 홈 5회 중앙값 17ms, 행사 목록 26ms, 상세 10ms, `/api/pet-travel` 12ms, 검색 `q=서울` 305ms(최대 384ms). 각 경로 모두 HTTP 200이다. 혼합 동시 10건도 전부 200, 완료시간 약 297~490ms였다. 이 수치는 짧은 LAN 시험이지 외부망·3천명/일 보증이 아니다. 검색 HTML은 약 603KB와 `no-store`였으며, 나머지 HTML은 기존 ISR 캐시 헤더를 유지했다.
- 비밀값 없는 시험 빌드에서는 외부 키가 필요한 경로를 실서비스 수준으로 검증할 수 없다. 사용자의 승인으로 DSM SSH를 임시 활성화했고 LAN `192.168.0.115:22` 접근을 확인했지만, 비밀번호 직접 입력과 키 이전이 끝나기 전에는 공개 전환하지 않는다. 이전 완료 또는 보류 종료 시 SSH를 다시 비활성화한다. 공유기 포트포워딩은 추가하지 않는다.
- `NAS_SMOKE_BASE=http://192.168.0.115:3275 node scripts/nas/smoke.mjs`로 홈·목록·검색·대표 상세·시티투어·API·robots·sitemap 총 9개 경로를 저부하로 재검사할 수 있다. 2026-09-27 LAN 실행에서 9/9 통과했다. 이 검사기는 응답 본문·키를 출력하지 않으며 실제 브라우저 검사나 외부망 검사의 대체물은 아니다.

## 이전 순서와 보류 조건

1. NAS 운영 폴더에 검토한 코드만 넣고 `runtime/app.env`를 NAS에서만 준비한다. `runtime`과 `.env*`는 Git·Docker 빌드 컨텍스트에서 제외한다. 키 이름만 확인하고 값은 출력하지 않는다.
2. Container Manager에서 NAS 앱을 빌드하고 LAN 전용 시험 주소를 확인한다. 동적 API·이미지·대표 기존 상세 URL·canonical·구조화 데이터·모바일·내부 링크를 Vercel과 비교한다.
3. GitHub의 새 데이터 커밋을 NAS가 감지하여 빌드·배포하는 경로를 만들고, 실패 시 기존 이미지가 유지되는지 확인한다. 한 시점에 발행 스케줄은 한 곳에서만 수행한다.
4. Cloudflare 무료 영역에 `mwohaji.kr`을 준비하고 모든 DNS 레코드를 대조한다. 터널을 NAS 앱에만 연결한다. DSM·Container Manager·관리 포트는 공개 호스트명으로 연결하지 않는다. 비공개 시험 주소는 접근 제어 또는 LAN 전용이어야 한다.
5. DNS 전환 직전 사이트맵 URL과 주요 페이지 기준을 재저장한다. 전환 뒤 외부망에서 HTTPS, 홈, 상세, 검색, 광고/제휴 링크, robots, sitemap, 모바일을 확인한다. 오류 시 DNS를 Vercel 원래 레코드로 되돌린다.
6. `/volume1/projects/free-culture`의 코드·영구 데이터를 `/volume2/backup`에 백업하고 실제 파일 1개를 별도 경로에 복원해 바이트/해시를 비교한다. `.next/cache`는 재생성 가능한 캐시로 분류한다. 같은 NAS의 디스크 3·4 백업은 화재/도난/본체 고장에 대한 외부 백업이 아니다.
7. 공개 전환 시각부터 최소 48시간 동안 접속, 오류, 일일 발행 결과, NAS CPU/RAM/디스크를 확인한다. 그동안 Vercel `free-culture`를 유지한다. **삭제 직전 정확한 프로젝트와 검증 결과를 사용자에게 보여 주고 별도 확인을 받은 뒤에만** 해당 프로젝트를 영구 삭제한다.

Vercel `free-culture` 삭제가 곧 Vercel 팀/Pro 구독료 0원을 뜻하지 않는다. 같은 팀의 다른 프로젝트와 도메인 등록료, 외부 AI API 비용은 별도로 확인해야 한다.
