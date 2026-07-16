"use client";

import { useCallback, useRef } from "react";

interface LongPressOptions {
  delay?: number;
  onLongPress: () => void;
}

export function useLongPress({ delay = 450, onLongPress }: LongPressOptions) {
  const timerRef = useRef<number | null>(null);

  const start = useCallback(() => {
    timerRef.current = window.setTimeout(onLongPress, delay);
  }, [delay, onLongPress]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear
  };
}
