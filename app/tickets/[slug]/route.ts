import { NextResponse } from "next/server";
import { getTicket } from "@/lib/tickets";
import { getAllPlaces } from "@/lib/tour";
import { hasSubstantivePlaceInfo } from "@/lib/placeQuality";
import { SITE } from "@/lib/site";

const normalize = (name: string) => name.replace(/[\s()·-]/g, "");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ticket = getTicket(slug);
  const matches = ticket
    ? getAllPlaces().filter((place) => normalize(place.title) === normalize(ticket.placeName))
    : [];
  const place = matches.length === 1 && hasSubstantivePlaceInfo(matches[0].id)
    ? matches[0]
    : undefined;
  return NextResponse.redirect(
    new URL(place ? `/places/spot/${place.id}` : "/places", SITE.url),
    301,
  );
}
