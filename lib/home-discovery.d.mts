export const homeFilters: [string,string][];
export function homeCandidates<T extends {start?:string;end?:string;kids?:boolean;free?:boolean}>(items:T[],filter:string,day:string,weekend:{start:string;end:string}):T[];
