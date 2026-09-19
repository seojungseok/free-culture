import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {recipeConfigs} from './autumn-recipes-config.mjs';
const store=JSON.parse(fs.readFileSync('data/weekend-prep.json','utf8'));
const research=JSON.parse(fs.readFileSync('data/autumn-recipes-20260919-research.json','utf8'));
const recipes=recipeConfigs();
const byId=new Map(store.products.map(p=>[p.id,p]));
const keys=new Map();
for(const r of research.records)if(r.candidate){byId.set(r.candidate.id,r.candidate);keys.set(r.key,r.candidate.id);}
// Keep proposed substitutions explicit and separate from any review approval.
for(const key of ['doenjang','perilla','butter','gochujang','mayonnaise'])if(keys.has(key+'-small'))keys.set(key,keys.get(key+'-small'));
keys.set('radish',keys.get('potato')); // Revised recipe uses potatoes, never dried radish.
keys.set('corn',keys.get('corn-alternative')); // Original 198g x4 option was visibly sold out.
const idOf=k=>byId.has(k)?k:keys.get(k);
const tools=[{key:'soup-tools',main:['9487214712','9206620361','9676631018'],support:[]},{key:'pan-tools',main:['9587833030','9707359364','9127118279'],support:[]}];
const out='.cache/autumn-recipe-references';fs.mkdirSync(out,{recursive:true});
const needed=[...new Set([...recipes,...tools].flatMap(r=>[...r.main,...r.support]).map(idOf))];
for(const id of needed){
 const p=byId.get(id);if(!p)throw Error('Unknown ingredient '+id);
 const file=path.join(out,id+'.png');
 if(!fs.existsSync(file)){
  const res=await fetch(p.image,{signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw Error('Product image failed: '+id+' '+res.status);
  await sharp(Buffer.from(await res.arrayBuffer())).resize(500,500,{fit:'inside'}).png().toFile(file);
 }
}
for(const recipe of [...recipes,...tools]){
 for(const part of ['main','support']){
  const ids=recipe[part].map(idOf);
  if(!ids.length)continue;
  const composites=[];
  for(let i=0;i<ids.length;i++){
   const pic=await sharp(path.join(out,ids[i]+'.png')).resize(480,440,{fit:'contain',background:'white'}).png().toBuffer();
   composites.push({input:pic,left:(i%2)*500+10,top:Math.floor(i/2)*500+10});
   const svg=Buffer.from(`<svg width="490" height="40"><rect width="490" height="40" fill="white"/><text x="10" y="28" font-size="22">${i+1}. ID ${ids[i]}</text></svg>`);
   composites.push({input:svg,left:(i%2)*500,top:Math.floor(i/2)*500+455});
  }
  await sharp({create:{width:1000,height:1000,channels:3,background:'white'}}).composite(composites).png().toFile(path.join(out,recipe.key+'-'+part+'.png'));
 }
}
const manifest=recipes.map(r=>({key:r.key,dish:r.dish,main:r.main.map(idOf),support:r.support.map(idOf)}));
fs.writeFileSync('data/autumn-recipes-20260919-assets.json',JSON.stringify({recipes:manifest,products:needed.map(id=>byId.get(id))},null,2)+'\n');
console.log(JSON.stringify({references:needed.length,boards:recipes.length*2,directory:out}));
