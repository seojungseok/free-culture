import {experienceContentBlocks} from '@/lib/experienceText.mjs';
import styles from './ExperienceBrowser.module.css';

export function ProgrammeFacts({rows}:{rows:string[][]}) {
 return <dl className={styles.facts}>{rows.filter(([,value])=>value).map(([label,value],index)=><div className={styles.factRow} key={label+index}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export default function ProgrammeContent({lines,list=false}:{lines:string[];list?:boolean}) {
 return <div className={styles.programmeContent}>{experienceContentBlocks(lines,list).map((block,index)=>block.type==='facts'?<ProgrammeFacts key={index} rows={block.items as string[][]}/>:block.type==='list'?<ul className={styles.sourceList} key={index}>{(block.items as string[]).map((line,i)=><li key={i}>{line}</li>)}</ul>:<p key={index}>{block.items[0] as string}</p>)}</div>;
}
