"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { eventExpiryTime, expiredEventSelectors, isEventPublished } from '@/lib/event-publication.mjs';

type Deadline = { id: string; expiresAt: string };
const pathsFor = (id: string) => [`/event/${id}`, `/festivals/event-${id}`, `/kids/c/ev-${id}`];

/** Removes an expired card even from a tab kept open across the deadline. */
export default function EventPublicationBoundary({ deadlines }: { deadlines: Deadline[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [expired, setExpired] = useState<string[]>([]);
  const refreshed = useRef('');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    let disposed = false, checking = false, calibrated = false, offset = 0, attempts = 0;
    const check = async () => {
      if (checking || disposed) return;
      clearTimeout(timer);
      let now = Date.now() + offset;
      let gone = deadlines.filter(event => !isEventPublished(event, now)).map(event => event.id);
      const currentExpired = gone.some(id => pathsFor(id).includes(pathname.replace(/\/$/, '')));
      // A fast device clock must not cause a 200 -> reload -> 200 loop.
      // Confirm against the server before redirecting and use its Date header.
      if (gone.length && (!calibrated || currentExpired) && attempts < 3) {
        checking = true;
        attempts++;
        try {
          const response = await fetch(window.location.href, {method:'HEAD', cache:'no-store', signal:controller.signal});
          if (disposed) return;
          const serverTime = Date.parse(response.headers.get('date') || '');
          if (Number.isFinite(serverTime)) {
            offset = serverTime - Date.now();
            calibrated = true;
            now = Date.now() + offset;
            gone = deadlines.filter(event => !isEventPublished(event, now)).map(event => event.id);
          }
          if (currentExpired && response.status === 410) {
            window.location.replace(window.location.href);
            return;
          }
        } catch { /* The next bounded check or visibility event can retry. */ }
        finally { checking = false; }
      }
      if (disposed) return;
      setExpired(previous => previous.join('|') === gone.join('|') ? previous : gone);
      const key = `${pathname}:${gone.join('|')}`;
      if (gone.length && refreshed.current !== key) {
        refreshed.current = key;
        window.dispatchEvent(new Event('event-publication-expired'));
        router.refresh();
      }
      const future = deadlines.map(event => eventExpiryTime(event)).filter((time): time is number => typeof time === 'number' && Number.isFinite(time) && time > now);
      if (future.length) timer = setTimeout(check, Math.min(Math.min(...future) - now, 2147483647));
      else if (gone.length && attempts < 3 && (!calibrated || currentExpired)) timer = setTimeout(check, 30000);
    };
    void check();
    const recheck = () => { void check(); };
    window.addEventListener('pageshow', recheck);
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener('pageshow', recheck);
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [deadlines, pathname, router]);

  // CSS also covers newly inserted client results and preserves saved-trip storage.
  const selectors = expiredEventSelectors(expired);
  return selectors.length ? <style data-event-expiry>{selectors.join(',')}{'{display:none!important}'}</style> : null;
}
