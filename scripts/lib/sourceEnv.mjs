import fs from 'node:fs';
export function loadSourceEnv() {
  const file=process.env.SOURCE_ENV_FILE;
  if(!file) return;
  for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)) {
    const match=line.match(/^(DATA_GO_KR_KEY|TOUR_API_KEY)=(.*)$/);
    if(match&&match[2].trim()&&!process.env[match[1]]) process.env[match[1]]=match[2].trim();
  }
}
