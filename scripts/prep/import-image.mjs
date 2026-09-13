import sharp from 'sharp';
import fs from 'node:fs';
const [source,name]=process.argv.slice(2);
if(!source||!/^[a-z0-9-]+$/.test(name||''))throw Error('사용법: node scripts/prep/import-image.mjs 원본경로 파일이름');
fs.mkdirSync('public/prep-images',{recursive:true});
const output=`public/prep-images/${name}.webp`;if(fs.existsSync(output))throw Error('기존 이미지 덮어쓰기 금지');
await sharp(source,{limitInputPixels:20000000}).rotate().resize(1200,800,{fit:'inside'}).webp({quality:82}).toFile(output);
console.log(output);
