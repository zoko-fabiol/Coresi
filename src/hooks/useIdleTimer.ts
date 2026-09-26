import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerProps {
  timeoutMinutes: number; // 0 means disabled
  onIdle: () => void;
  isEnabled?: boolean;
}

export const useIdleTimer = ({
  timeoutMinutes,
  onIdle,
  isEnabled = true,
}: UseIdleTimerProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isEnabled || timeoutMinutes <= 0) return;

    timerRef.current = setTimeout(() => {
      onIdle();
    }, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, onIdle, isEnabled]);

  useEffect(() => {
    if (!isEnabled || timeoutMinutes <= 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [resetTimer, isEnabled, timeoutMinutes]);

  return { resetTimer };
};
