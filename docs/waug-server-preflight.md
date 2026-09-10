서버 연결 점검만 수행한다. 글·이미지 생성, 데이터 편집, 웹 조사, API 키 조회/출력은 금지한다. 다음 세 가지 명령만 실행한다.
1. `node --check scripts/waug/image-api.mjs`
2. `node -e "fetch('http://127.0.0.1:47831/health').then(r=>{if(!r.ok)process.exit(1);return r.text()}).then(console.log)"`
3. `node scripts/waug/checkpoint.mjs` (데이터 변경이 없는 상태의 저장 경로 점검이다. 새 파일을 만들지 않는다.)
모두 성공하면 '서버 편집기·네트워크·저장 경로 연결 확인. 글 0개, 이미지 0개 생성.'만 답한다. 실패하면 실패한 명령 번호만 보고한다. 다른 행동을 하지 않는다. 2분 안에 종료한다.
