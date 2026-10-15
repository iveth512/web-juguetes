'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'offers-end-date';
const OFFER_DAYS = 7;

let fallbackEndTime: number | null = null;

function weekFromNow(): number {
  const end = new Date();
  end.setDate(end.getDate() + OFFER_DAYS);
  return end.getTime();
}

// The end date lives in sessionStorage so the countdown survives navigation within the session.
function readEndTime(): number {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return new Date(stored).getTime();
    const end = weekFromNow();
    sessionStorage.setItem(STORAGE_KEY, new Date(end).toISOString());
    return end;
  } catch {
    fallbackEndTime ??= weekFromNow();
    return fallbackEndTime;
  }
}

const subscribe = () => () => {};

/** Milliseconds left in the weekly offers, or null during SSR/hydration. */
export function useOffersCountdown(tickMs: number): number | null {
  const endTime = useSyncExternalStore(subscribe, readEndTime, () => null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(interval);
  }, [tickMs]);

  return endTime === null ? null : Math.max(0, endTime - now);
}
