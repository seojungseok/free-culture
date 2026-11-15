import { filterExperiences, indexableExperience } from '@/lib/experienceData';
import { renderExperienceFeed } from '@/lib/experienceFeed';

export const dynamic = 'force-static';
export const revalidate = 60;

export function GET() {
  // Share the current recruitment rules used by the public programme directory.
  const items = filterExperiences(undefined).filter(indexableExperience).slice(0, 60);
  return new Response(renderExperienceFeed(items), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
