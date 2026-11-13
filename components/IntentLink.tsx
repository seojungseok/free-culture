"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

// Many visible home links used to fetch whole routes before any user intent.
// Keep client navigation, and warm only the link the visitor points at or focuses.
export default function IntentLink({href,onPointerEnter,onFocus,...props}:ComponentProps<typeof Link>) {
  const router=useRouter();
  const warm=()=>{
    if(typeof href!=="string"||!href.startsWith("/")||href.startsWith("//"))return;
    router.prefetch(href);
  };
  return <Link {...props} href={href} prefetch={false}
    onPointerEnter={event=>{onPointerEnter?.(event);if(event.pointerType==="mouse"&&!event.defaultPrevented)warm();}}
    onFocus={event=>{onFocus?.(event);if(!event.defaultPrevented)warm();}}/>;
}
