import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
export function loadRuntimeEnv({localGit=false}={}){
 if(fs.existsSync('.env.local'))for(const line of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
 if(localGit&&!process.env.COUPANG_QUEUE_GITHUB_TOKEN&&!process.env.GITHUB_TOKEN){
  const result=execFileSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',stdio:['pipe','pipe','ignore'],env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'}});
  const password=result.split(/\r?\n/).find(l=>l.startsWith('password='))?.slice(9);
  if(password)process.env.COUPANG_QUEUE_GITHUB_TOKEN=password;
 }
}
