import {randomUUID} from 'node:crypto';
import {githubRequest,QUEUE_BRANCH} from './github-budget.mjs';
import {loadRuntimeEnv} from './runtime-env.mjs';
loadRuntimeEnv({localGit:!process.env.GITHUB_ACTIONS});
const existing=await githubRequest(`git/ref/heads/${QUEUE_BRANCH}`);
if(existing.r.ok){console.log('기존 공용 기록 유지. 초기화·잠금 해제하지 않습니다.');process.exit(0);}
if(existing.r.status!==404)throw Error('공용 기록 존재 여부 확인 실패');
for(const status of ['in_progress','queued']){const {r}=await githubRequest(`actions/runs?status=${status}&per_page=100`);if(!r.ok)throw Error('기존 수집 작업 확인 실패');const d=await r.json();if(d.total_count>100||d.workflow_runs.some(x=>/daily\.yml|coupang\.yml/.test(x.path)))throw Error('기존 쿠팡 수집 종료 후 초기화하세요');}
const state={version:1,revision:randomUUID(),cap:10,window:60000,interval:6100,nextAt:existing.now+120000,events:[],lock:null,cache:{}};
async function post(p,body){const {r}=await githubRequest(p,{method:'POST',body});if(!r.ok)throw Error(`공용 기록 초기화 실패 (${r.status})`);return r.json();}
const tree=await post('git/trees',{tree:[{path:'coupang-state.json',mode:'100644',type:'blob',content:JSON.stringify(state)},{path:'vercel.json',mode:'100644',type:'blob',content:JSON.stringify({git:{deploymentEnabled:false}})}]});
const commit=await post('git/commits',{message:'Initialize durable shared Coupang budget; no site deployment',tree:tree.sha,parents:[]});
await post('git/refs',{ref:`refs/heads/${QUEUE_BRANCH}`,sha:commit.sha});
console.log('공용 기록 초기화 완료. 최초 조회는 안전 대기 이후 허용됩니다.');
