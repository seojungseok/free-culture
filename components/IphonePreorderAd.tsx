"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./IphonePreorderAd.module.css";

const OFFER_URL = "https://link.coupang.com/a/gZcgiEXfTU";
const HIDE_UNTIL_KEY = "mwohaji:iphone18:popup-hidden-until";
const SESSION_KEY = "mwohaji:iphone18:popup-dismissed";
const DISCLOSURE = "이 광고는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

export default function IphonePreorderAd() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const banner = useRef<HTMLElement>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const element = banner.current;
    const header = element?.previousElementSibling;
    if (!element) return;
    element.style.setProperty("--ad-header-height", "0px");
    if (!(header instanceof HTMLElement) || header.tagName !== "HEADER") return;
    const updateOffset = () => element.style.setProperty("--ad-header-height", `${header.getBoundingClientRect().height}px`);
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    try {
      if (Number(localStorage.getItem(HIDE_UNTIL_KEY)) > Date.now()) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch { /* The advertisement still works when browser storage is disabled. */ }
    const timer = window.setTimeout(() => setShowPopup(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showPopup || !dialog.current) return;
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [showPopup]);

  function dismiss(forDay = false) {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
      if (forDay) localStorage.setItem(HIDE_UNTIL_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    } catch { /* Closing is independent of storage availability. */ }
    setShowPopup(false);
  }

  return <>
    <aside ref={banner} className={styles.bannerWrap} aria-label="아이폰 18 사전예약 광고">
      <a className={styles.banner} href={OFFER_URL} target="_blank" rel="sponsored noopener noreferrer">
        <span className={styles.bannerArtwork}>
          <img className={styles.bannerImage} src="/ads/iphone18-autumn-banner-20260913.webp" alt="주말 사진, 더 잘 남기고 싶다면 · 아이폰 18 Pro 사전예약 · 가격·혜택 확인하기" width="1600" height="537" />
          <span aria-hidden="true" className={`${styles.shine} ${styles.bannerShine}`} />
        </span>
      </a>
      <p className={styles.disclosure}>{DISCLOSURE}</p>
    </aside>
    {showPopup && <dialog ref={dialog} className={styles.dialog} aria-label="아이폰 18 사전예약 광고" aria-describedby="iphone18-ad-disclosure" onCancel={(event) => { event.preventDefault(); dismiss(); }} onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <div className={styles.popup}>
        <button type="button" className={styles.close} onClick={() => dismiss()} aria-label="광고 닫기" autoFocus>×</button>
        <a href={OFFER_URL} target="_blank" rel="sponsored noopener noreferrer" className={styles.poster} onClick={() => dismiss()}>
          <img src="/ads/iphone18-autumn-popup-20260913.webp" alt="주말 사진, 더 잘 남기고 싶다면 · 아이폰 18 Pro 사전예약 · 가격·혜택 확인하기" width="960" height="1200" />
          <span aria-hidden="true" className={`${styles.shine} ${styles.popupShine}`} />
        </a>
        <p id="iphone18-ad-disclosure" className={styles.popupDisclosure}>{DISCLOSURE}</p>
        <div className={styles.controls}>
          <button type="button" onClick={() => dismiss(true)}>하루 동안 보지 않기</button>
          <button type="button" onClick={() => dismiss()}>닫기</button>
        </div>
      </div>
    </dialog>}
  </>;
}
