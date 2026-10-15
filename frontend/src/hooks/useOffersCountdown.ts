'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

// Colombia has no daylight saving time, so Bogotá is always UTC-5.
const BOGOTA_OFFSET_HOURS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Weekly offers rotate on Monday 00:00 in Bogotá. Every visitor sees the same deadline,
 * unlike a per-session timer, which would invent urgency.
 */
export function nextOffersRotation(now: number = Date.now()): number {
  const bogota = new Date(now - BOGOTA_OFFSET_HOURS * 60 * 60 * 1000);
  const daysUntilMonday = ((8 - bogota.getUTCDay()) % 7) || 7;
  const mondayMidnightBogota = Date.UTC(
    bogota.getUTCFullYear(),
    bogota.getUTCMonth(),
    bogota.getUTCDate() + daysUntilMonday,
  );
  return mondayMidnightBogota + BOGOTA_OFFSET_HOURS * 60 * 60 * 1000;
}

const subscribe = () => () => {};
const readEndTime = () => nextOffersRotation();

/** Milliseconds left in the weekly offers, or null during SSR/hydration. */
export function useOffersCountdown(tickMs: number): number | null {
  const endTime = useSyncExternalStore(subscribe, readEndTime, () => null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(interval);
  }, [tickMs]);

  if (endTime === null) return null;
  // Past the rotation without a reload: roll over to the following week.
  const end = now >= endTime ? endTime + 7 * DAY_MS : endTime;
  return Math.max(0, end - now);
}
