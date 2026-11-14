export type DataSourceStatus = {id:string;label:string;provider:string;interval:string;count:number;checkedAt:string|null;status:'fresh'|'partial'|'stale'|'missing'};
export type DataFreshnessReport = {checkedAt:string;healthy:boolean;sources:DataSourceStatus[]};
export const DATA_SOURCES: {id:string;label:string;provider:string;file:string;field:string;interval:string;maxHours:number;allowEmpty?:boolean}[];
export function buildDataFreshness(datasets:Record<string,unknown>, now?:Date):DataFreshnessReport;
export function readDataFreshness(options?:{directory?:string;now?:Date}):DataFreshnessReport;
