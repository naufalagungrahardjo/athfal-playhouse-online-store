import { useEffect, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours
const LAST_ACTIVITY_KEY = 'lastActivityTimestamp';
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export const useInactivityLogout = (
  isLoggedIn: boolean,
  onLogout: () => void
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateActivity = useCallback(() => {
    if (!isLoggedIn) return;
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    // Reset timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [isLoggedIn, onLogout]);

  useEffect(() => {
    if (!isLoggedIn) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Always refresh activity timestamp when becoming logged in.
    // This prevents stale timestamps (from a previous session, or another
    // device/browser) from instantly logging the user out on fresh login.
    updateActivity();

    // Throttle activity updates to once per minute
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 60_000) {
        lastUpdate = now;
        updateActivity();
      }
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, throttledUpdate, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, throttledUpdate);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoggedIn, onLogout, updateActivity]);
};
