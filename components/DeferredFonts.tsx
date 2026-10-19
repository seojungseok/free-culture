"use client";
import { useEffect, useRef } from "react";

// The external font stylesheet must not block the first screen on a cold visit.
export default function DeferredFonts() {
  const stylesheet = useRef<HTMLLinkElement>(null);
  useEffect(() => {
    // Also handles a cached stylesheet that loaded before React hydrated.
    if (stylesheet.current) stylesheet.current.media = "all";
  }, []);
  return <>
    <link ref={stylesheet} rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" media="print" onLoad={(event) => { event.currentTarget.media = "all"; }} />
    <noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" /></noscript>
  </>;
}
