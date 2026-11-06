export type ExpiringEvent = { expiresAt?: string };
export function eventExpiryTime(event: ExpiringEvent): number | null;
export function isEventPublished(event: ExpiringEvent, now?: number): boolean;
export function expiredEventForPath<T extends ExpiringEvent & { id: string; imgUrl?: string; gallery?: {src:string}[] }>(events: T[], pathname: string, now?: number): T | undefined;
export function expiredEventSelectors(ids: string[]): string[];
export function eventPublicationPaths(event: {id:string;imgUrl?:string;gallery?:{src:string}[]}): string[];
