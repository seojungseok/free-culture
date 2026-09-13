import fs from 'node:fs';
import {validateShape} from './content.mjs';
export const file='data/weekend-prep.json';
export function readStore(){return validateShape(JSON.parse(fs.readFileSync(file,'utf8')));}
export function saveStore(next,expected){
 const lock=fs.openSync(file+'.lock','wx');
 try{const current=readStore();if(current.version!==expected)throw Error('다른 작업에서 변경되었습니다. 다시 불러오세요.');validateShape(next);const value={...next,version:current.version+1};fs.mkdirSync('.cache/prep-backups',{recursive:true});fs.copyFileSync(file,`.cache/prep-backups/${Date.now()}-${current.version}.json`);fs.writeFileSync(file+'.tmp',JSON.stringify(value,null,2)+'\n');fs.renameSync(file+'.tmp',file);return value;}
 finally{fs.closeSync(lock);fs.unlinkSync(file+'.lock');}
}
