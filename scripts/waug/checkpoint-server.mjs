// Trusted narrow broker runs outside the editor sandbox; only content checkpoints and approved image jobs.
import http from 'node:http';import path from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const exec=promisify(execFile);let checkpoint=Promise.resolve();let imageBusy=false;
http.createServer(async(req,res)=>{
 try{
  if(req.method==='GET'&&req.url==='/health'){res.end('ready');return;}
  if(process.env.WAUG_SERVER_EXECUTION!=='1')throw Error('서버 실행 모드 아님');
  if(req.method==='POST'&&req.url==='/checkpoint'){
   checkpoint=checkpoint.catch(()=>{}).then(()=>exec(process.execPath,['scripts/waug/checkpoint-direct.mjs'],{timeout:100000,maxBuffer:1024*1024}));await checkpoint;res.end('Durable checkpoint saved');return;
  }
  if(req.method==='POST'&&req.url==='/image'){
   if(imageBusy){res.writeHead(409);res.end('Image request already running');return;}
   let body='';for await(const part of req){body+=part;if(body.length>4096)throw Error('요청 크기 초과');}
   const {placeId,recipeFile}=JSON.parse(body);if(!/^[a-z0-9-]+$/.test(placeId||''))throw Error('장소 ID 오류');
   const base=path.resolve('data/waug/image-jobs',placeId)+path.sep,target=path.resolve(recipeFile);if(!target.startsWith(base)||!target.endsWith('.json'))throw Error('레시피 경로 오류');
   imageBusy=true;try{const r=await exec(process.execPath,['scripts/waug/image-api.mjs',placeId,target],{env:{...process.env,WAUG_IMAGE_WORKER:'1'},timeout:360000,maxBuffer:2*1024*1024});res.end(r.stdout);}finally{imageBusy=false;}return;
  }
  res.writeHead(404);res.end('Unknown operation');
 }catch(error){res.writeHead(500);res.end('Server operation failed; saved job state requires review');console.error('broker operation failed:',error.code||'validation');}
}).listen(47831,'127.0.0.1',()=>console.log('Content checkpoint broker ready'));
