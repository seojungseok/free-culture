import {safeEvidence,checkSummaries} from './winter-course.mjs';

export function collectEvidence(courses, rawCourses, overviews, details, courseDetails) {
  const sources=new Map(rawCourses.map(c=>[String(c.id),c]));
  const result=new Map();
  // Keep the origin for each exact sentence. A cache check is not the date on
  // which the provider published the underlying information.
  result.provenance=new Map();
  for(const course of courses) {
    const original=sources.get(String(course.sourceCourseId));
    for(const stop of course.stops) {
      const id=String(stop.placeId);
      const sourceStop=original?.stops?.find(s=>String(s.placeId)===id && String(s.name).trim()===stop.name);
      const options=[
        {text:details[id]?.overview,file:'data/place-details.json',checkedAt:details[id]?.overviewCheckedAt},
        {text:courseDetails[id]?.overview,file:'data/course-place-details.json',checkedAt:courseDetails[id]?.commonCheckedAt},
        {text:overviews[id],file:'data/place-overviews.json'},
        {text:sourceStop?.overview,file:'data/courses-auto.json'},
      ];
      const sentences=[], origins=new Map();
      for (const option of options) for (const sentence of safeEvidence(option.text)) {
        if (origins.has(sentence)) continue;
        const checkedAt=typeof option.checkedAt==='string' && Number.isFinite(Date.parse(option.checkedAt)) ? option.checkedAt : null;
        origins.set(sentence,{file:option.file,placeId:id,checkedAt});
        sentences.push(sentence);
      }
      if(sentences.length) {
        result.set(id,sentences.slice(0,2));
        result.provenance.set(id,origins);
      }
    }
  }
  return result;
}

export async function summarizeEvidence(evidence, key, model, fetchImpl=fetch) {
  if(!evidence.size)return new Map();
  const input=[...evidence].map(([placeId,sentences])=>({placeId,sentences}));
  const prompt=`각 장소에서 고유한 특징을 설명하는 제공 문장 하나만 그대로 고르세요. 정보를 추측하거나 바꾸지 말고 적합한 문장이 없으면 그 장소를 생략하세요. JSON만 반환: {"stops":[{"placeId":"id","quote":"제공 문장 그대로"}]}. 자료: ${JSON.stringify(input)}`;
  if(prompt.length>24000)throw Error('WINTER_SUMMARY_INPUT_LIMIT');
  const response=await fetchImpl('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model,response_format:{type:'json_object'},messages:[{role:'system',content:'Select only exact supplied source sentences. The output remains an unpublished draft for editorial review.'},{role:'user',content:prompt}],max_completion_tokens:4000}),signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error(`WINTER_SUMMARY_HTTP_${response.status}`);
  const json=await response.json();return checkSummaries(json.choices?.[0]?.message?.content,evidence);
}
