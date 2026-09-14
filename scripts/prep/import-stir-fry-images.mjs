import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const generated = 'C:/Users/tjwjd/.codex/generated_images/01a09f8e-ad52-77a1-bb23-989b1dbb0270';
const output = path.resolve('public/prep-images');

const files = {
  'camp-jeyuk-bokkeum-cover.webp': 'exec-0f722503-19ee-4fd2-a9fd-84eb357325d9.png',
  'camp-jeyuk-bokkeum-prep.webp': 'exec-e65f6087-0256-41ec-b26e-0089f504f5d5.png',
  'camp-jeyuk-bokkeum-cooking.webp': 'exec-c35358e1-0a1c-4b66-bf22-11a0f092d95a.png',
  'camp-sundae-bokkeum-cover.webp': 'exec-67ef88ed-c235-4983-ad08-9534559333ec.png',
  'camp-sundae-bokkeum-prep.webp': 'exec-1209e885-fa64-4431-a82f-2736ec989f52.png',
  'camp-sundae-bokkeum-cooking.webp': 'exec-18ba7a0b-0524-4d3a-ae46-fab6c533fac1.png',
  'camp-dakgalbi-cover.webp': 'exec-fe78a4f7-18cf-4b8b-ab75-09a4f67723ec.png',
  'camp-dakgalbi-prep.webp': 'exec-698b71bb-a262-4b60-8c78-2d2cc4633df3.png',
  'camp-dakgalbi-cooking.webp': 'exec-ef34ee6e-9bc8-4359-b368-434ffc4a0c23.png',
  'camp-ojingeo-bokkeum-cover.webp': 'exec-82866ea1-02c9-4dfb-8f8a-4e82b955f447.png',
  'camp-ojingeo-bokkeum-prep.webp': 'exec-42f2a2fe-28f1-4c10-b4c6-734c1d226add.png',
  'camp-ojingeo-bokkeum-cooking.webp': 'exec-ecf41e38-d035-4348-8b84-4ac91fe1e4c7.png',
  'camp-kimchi-fried-rice-cover.webp': 'exec-868960e0-f2ff-4728-8413-bab8105259cd.png',
  'camp-kimchi-fried-rice-prep.webp': 'exec-67571409-f0cd-4426-9cc9-0edbc232c585.png',
  'camp-kimchi-fried-rice-cooking.webp': 'exec-9f01634a-173c-4e56-8bcc-a6eee05d2a7d.png',
};

await fs.mkdir(output, { recursive: true });
for (const [name, source] of Object.entries(files)) {
  const input = path.join(generated, source);
  await fs.access(input);
  await sharp(input)
    .resize(1200, 800, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(output, name));
}

const names = Object.keys(files);
const contactWidth = 1200;
const thumbWidth = 400;
const thumbHeight = 267;
const rows = Math.ceil(names.length / 3);
const composites = [];
for (const [index, name] of names.entries()) {
  composites.push({
    input: await sharp(path.join(output, name)).resize(thumbWidth, thumbHeight).jpeg({ quality: 82 }).toBuffer(),
    left: (index % 3) * thumbWidth,
    top: Math.floor(index / 3) * thumbHeight,
  });
}
await fs.mkdir(path.resolve('.cache/prep-stir-fry-images'), { recursive: true });
await sharp({
  create: { width: contactWidth, height: rows * thumbHeight, channels: 3, background: '#ffffff' },
}).composite(composites).jpeg({ quality: 86 }).toFile(path.resolve('.cache/prep-stir-fry-images/contact-sheet.jpg'));

console.log(JSON.stringify({ imported: Object.keys(files).length, output }, null, 2));
