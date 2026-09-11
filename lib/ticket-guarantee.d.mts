export type PriceGuarantee = {
  status: 'confirmed' | 'unconfirmed'; affiliateUrl: string; sourceUrl: string;
  conditions: string; evidenceText: string; pageSha256: string; checkedAt: string;
  reviewedAt: string; expiresAt: string; reason?: string;
};
export const TICKET_POLICY: string;
export const AI_DISCLOSURE: string;
export const AFFILIATE_DISCLOSURE: string;
export function guaranteeActive(g: PriceGuarantee | null | undefined, href: string, now?: number): boolean;
export function bookingLabel(g: PriceGuarantee | null | undefined, href: string, now: number): string;
