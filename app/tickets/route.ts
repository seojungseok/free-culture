import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";

export function GET() {
  return NextResponse.redirect(new URL("/places", SITE.url), 301);
}
