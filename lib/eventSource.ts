import sourceData from '@/data/event-source-details.json';
import type { CultureEvent, EventSourceDetail } from '@/lib/types';
const records=sourceData as unknown as {events:Record<string,{sourceDetail?:EventSourceDetail}>};
export function eventSourceDetail(event:Pick<CultureEvent,'id'|'title'|'startDate'|'endDate'>):EventSourceDetail|undefined {
  const record=records.events[event.id]?.sourceDetail;
  return record?.status==='verified'&&record.eventTitle===event.title&&record.eventStartDate===event.startDate&&record.eventEndDate===event.endDate?record:undefined;
}
