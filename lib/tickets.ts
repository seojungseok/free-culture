import redirects from '@/data/ticket-redirects.json';

/** Legacy ticket addresses keep their relevant place redirect without old sales content. */
export function getTicketPlaceName(slug: string): string | undefined {
  return (redirects as Record<string, string>)[slug];
}
