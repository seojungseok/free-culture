"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./IphonePreorderAd.module.css";

const OFFER_URL = "https://link.coupang.com/a/gZcgiEXfTU";
const HIDE_UNTIL_KEY = "mwohaji:iphone18:popup-hidden-until";
const SESSION_KEY = "mwohaji:iphone18:popup-dismissed";
const DISCLOSURE = "이 광고는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

export default function IphonePreorderAd() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [showPopup, setShowPopup] = useState(false);

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
    <aside className={styles.bannerWrap} aria-label="아이폰 18 사전예약 광고">
      <a className={styles.banner} href={OFFER_URL} target="_blank" rel="sponsored noopener noreferrer">
        <img className={styles.bannerImage} src="/ads/iphone18-rocket-banner.webp" alt="아이폰 18 사전예약 · 로켓배송 · 사전예약 혜택 보기" width="1440" height="480" />
      </a>
      <p className={styles.disclosure}>{DISCLOSURE}</p>
    </aside>
    {showPopup && <dialog ref={dialog} className={styles.dialog} aria-label="아이폰 18 사전예약 광고" aria-describedby="iphone18-ad-disclosure" onCancel={(event) => { event.preventDefault(); dismiss(); }} onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <div className={styles.popup}>
        <button type="button" className={styles.close} onClick={() => dismiss()} aria-label="광고 닫기" autoFocus>×</button>
        <a href={OFFER_URL} target="_blank" rel="sponsored noopener noreferrer" className={styles.poster} onClick={() => dismiss()}>
          <img src="/ads/iphone18-rocket-popup.webp" alt="아이폰 18 사전예약 · 사전예약은 로켓배송으로 · 사전예약 혜택 보기" width="800" height="1000" />
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
