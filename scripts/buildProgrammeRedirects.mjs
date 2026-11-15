import fs from 'node:fs';
import path from 'node:path';
import {groupProgrammeSessions} from '../lib/programmeAvailability.mjs';
import {cleanExperienceText} from '../lib/experienceText.mjs';

// Build HTTP redirects from the same identity rules as the public directories.
// Resolve them before React streams its loading shell and HTML redirect fallback.
export function programmeRedirects(root){
 const read=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name+'.json'),'utf8'));
 const learning=read('learning-classes'),science=read('science-experiences'),venues=read('experience-venues').venues;
 const classes=[...learning.courses.map(row=>({...row,active:true})),...(learning.archivedCourses||[]).map(row=>({...row,active:false}))].map(row=>({...row,description:cleanExperienceText(row.description)}));
 const activities=science.records.map(row=>({...row,phone:row.phone||venues['science/'+row.id]?.phone||'',address:row.address||venues['science/'+row.id]?.address||''}));
 return [[groupProgrammeSessions(classes,'class'),'/classes/detail/'],[groupProgrammeSessions(activities,'science'),'/experiences/science/']].flatMap(([groups,prefix])=>groups.flatMap(item=>item.aliases.filter(id=>id!==item.id).map(id=>({source:prefix+id,destination:prefix+item.id,permanent:true}))));
}
