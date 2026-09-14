import {loadRuntimeEnv} from './runtime-env.mjs';
import {githubBackend, githubRequest} from './github-budget.mjs';

loadRuntimeEnv({localGit: !process.env.GITHUB_ACTIONS});

if (process.env.COUPANG_MANUAL_RECOVERY !== '1') {
  throw new Error('수동 복구 확인값이 없습니다.');
}

for (const status of ['in_progress', 'queued', 'waiting', 'requested']) {
  const {r} = await githubRequest(`actions/runs?per_page=100&status=${status}`);
  if (!r.ok) throw new Error(`GitHub 작업 상태 확인 실패 (${r.status})`);
  const data = await r.json();
  if ((data.total_count || 0) > 0) throw new Error(`GitHub ${status} 작업이 있어 잠금을 유지합니다.`);
}

const snapshot = await githubBackend.read();
if (!snapshot.state.lock) {
  console.log('잠금이 없어 복구할 내용이 없습니다.');
  process.exit(0);
}

const ownerEvent = snapshot.state.events.find((event) => event.id === snapshot.state.lock);
if (!ownerEvent || snapshot.now - ownerEvent.at < snapshot.state.window * 2) {
  throw new Error('잠금 소유 기록이 없거나 충분히 오래되지 않아 잠금을 유지합니다.');
}

const recovered = {
  ...snapshot.state,
  lock: null,
  nextAt: snapshot.now + Math.max(60000, snapshot.state.window) + 2000,
  recovery: {
    at: new Date(snapshot.now).toISOString(),
    reason: 'No active, queued, waiting, or requested GitHub Actions; stale owner event exceeded two windows.',
    preservedEvents: snapshot.state.events.length
  }
};

if (!await githubBackend.write(snapshot, recovered)) {
  throw new Error('공용 제한 기록이 동시에 변경되어 복구를 중단했습니다.');
}

console.log(JSON.stringify({
  recovered: true,
  serverTime: new Date(snapshot.now).toISOString(),
  nextAt: new Date(recovered.nextAt).toISOString(),
  preservedEvents: recovered.events.length
}, null, 2));
