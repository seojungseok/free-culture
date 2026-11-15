import { filterExperiences, indexableExperience } from '@/lib/experienceData';
import { renderExperienceFeed } from '@/lib/experienceFeed';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function GET() {
  // Fairly mix the three categories; never fetch an upstream API on a visitor request.
  const items = filterExperiences(undefined).filter(indexableExperience).slice(0, 60);
  return new Response(renderExperienceFeed(items), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
