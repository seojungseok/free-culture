#!/usr/bin/env node
// Offline only. No network, provider APIs, identities, or changes to source logs.
// NAS example: node scripts/report-affiliate-events.mjs --input runtime/sharelink/events --from 2026-11-06 --to 2026-11-12
// Dates cover full Korean calendar days. Explicit ISO timestamps use [from, to).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {createAffiliateEventReport} from '../lib/affiliate-events-report.mjs';

function resolvedOutput(file){
 const absolute=path.resolve(file),missing=[];let parent=path.dirname(absolute);
 while(!fs.existsSync(parent)){missing.unshift(path.basename(parent));parent=path.dirname(parent);}
 return path.join(fs.realpathSync(parent),...missing,path.basename(absolute));
}

async function main(){
 const args=process.argv.slice(2),options={};
 if(args.length===1&&args[0]==='--help'){
  console.log('node scripts/report-affiliate-events.mjs --input LOG_DIRECTORY [--from YYYY-MM-DD|ISO_TIMESTAMP] [--to YYYY-MM-DD|ISO_TIMESTAMP] [--output FILE]\n날짜는 한국시간 하루 전체를 포함합니다. ISO 시각의 from은 포함, to는 제외합니다. 출력은 클릭/노출 이벤트 비율이며 사용자 전환율이나 구매·수수료가 아닙니다. 원본 로그는 변경하지 않습니다.');return;
 }
 for(let i=0;i<args.length;i+=2){
  const key=args[i];
  if(!['--input','--from','--to','--output'].includes(key)||!args[i+1]||args[i+1].startsWith('--')||Object.hasOwn(options,key.slice(2)))throw Error('Invalid arguments');
  options[key.slice(2)]=args[i+1];
 }
 if(!options.input)throw Error('An explicit log directory is required');
 const input=fs.realpathSync(path.resolve(options.input)),report=createAffiliateEventReport(options);
 const files=fs.readdirSync(input,{withFileTypes:true}).filter(entry=>entry.isFile()&&/^\d{4}-\d{2}-\d{2}\.jsonl$/.test(entry.name)).map(entry=>entry.name).sort();
 if(!files.length)throw Error('No source logs available');
 const output=options.output?resolvedOutput(options.output):null;
 const relative=output?path.relative(input,output):null;
 if(output&&(relative===''||(relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative))))throw Error('Output must be outside the source log directory');
 for(const name of files){
  const lines=readline.createInterface({input:fs.createReadStream(path.join(input,name),{encoding:'utf8'}),crlfDelay:Infinity});
  for await(const line of lines)report.consume(line);
 }
 const result={generatedAt:new Date().toISOString(),sourceFiles:files.length,...report.finish()};
 const json=JSON.stringify(result,null,2)+'\n';
 if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,json,{mode:0o600,flag:'wx'});console.log(JSON.stringify({passed:true,sourceFiles:files.length,quality:result.quality,totals:result.totals,groups:result.rows.length,purchaseCollected:false}));}
 else process.stdout.write(json);
}
main().catch(()=>{console.error(JSON.stringify({passed:false,error:'집계하지 못했습니다. 입력 폴더·일별 JSONL 파일·기간·출력 위치와 읽기 권한을 확인하세요. 출력 파일은 로그 폴더 밖의 새 파일이어야 합니다. 운영 로그가 없으면 0건 성과로 해석하지 마세요.'}));process.exitCode=1;});
