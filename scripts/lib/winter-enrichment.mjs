import {safeEvidence,checkSummaries} from './winter-course.mjs';

export function collectEvidence(courses, rawCourses, overviews, details, courseDetails) {
  const sources=new Map(rawCourses.map(c=>[String(c.id),c]));
  const result=new Map();
  for(const course of courses) {
    const original=sources.get(String(course.sourceCourseId));
    for(const stop of course.stops) {
      const id=String(stop.placeId);
      const sourceStop=original?.stops?.find(s=>String(s.placeId)===id && String(s.name).trim()===stop.name);
      const options=[sourceStop?.overview,overviews[id],details[id]?.overview,courseDetails[id]?.overview];
      const sentences=[...new Set(options.flatMap(s=>safeEvidence(s)))].slice(0,2);
      if(sentences.length)result.set(id,sentences);
    }
  }
  return result;
}

export async function summarizeEvidence(evidence, key, model, fetchImpl=fetch) {
  if(!evidence.size)return new Map();
  const input=[...evidence].map(([placeId,sentences])=>({placeId,sentences}));
  const prompt=`각 장소의 제공된 문장만 근거로 고유한 특징을 1문장으로 설명하고 원문에서 인용한 문장도 그대로 적으세요. 출처에 없는 사실, 숫자, 날씨, 계절 상태, 운영일, 시간, 요금, 휴무, 예약, 체험 가능 여부를 추가하지 마세요. 문장을 안전하게 요약할 수 없는 장소는 결과에서 생략하세요. JSON만 반환: {"stops":[{"placeId":"id","quote":"제공 문장 그대로","summary":"설명"}]}. 자료: ${JSON.stringify(input)}`;
  if(prompt.length>24000)throw Error('WINTER_SUMMARY_INPUT_LIMIT');
  const response=await fetchImpl('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model,response_format:{type:'json_object'},messages:[{role:'system',content:'Only summarize the supplied source text. The output remains a private draft for editorial review.'},{role:'user',content:prompt}],max_completion_tokens:4000}),signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error(`WINTER_SUMMARY_HTTP_${response.status}`);
  const json=await response.json();return checkSummaries(json.choices?.[0]?.message?.content,evidence);
}
