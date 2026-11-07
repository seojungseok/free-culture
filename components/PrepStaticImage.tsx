'use client';
import NextImage, {type ImageProps} from 'next/image';
import staticImages from '@/data/weekend-prep-static-images.json';
const sizes = staticImages as Record<string,number[]>;
export default function PrepStaticImage(props:ImageProps){
 const src=typeof props.src==='string'?props.src:'';
 const widths=sizes[src];
 // Local prep WebP files are already compressed. Avoid a cold, on-demand
 // server conversion when no pre-generated responsive variant exists.
 if(!widths)return <NextImage {...props} unoptimized={props.unoptimized || /^\/prep-images\/[^/?#]+\.webp$/i.test(src)}/>;
 return <NextImage {...props} loader={({width})=>{
  const selected=widths.find(n=>n>=width)||widths[widths.length-1];
  return selected===1200?src:src.replace(/\.webp$/,`-w${selected}.webp`);
 }}/>;
}
