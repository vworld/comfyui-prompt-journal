import { useCallback, useEffect, useRef } from "react";

export function useDebounce() {
  const timeoutRef = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current === null) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const debounce = useCallback(
    (callback: () => Promise<void> | void, delay = 300) => {
      cancel();

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        return callback();
      }, delay);
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { debounce, cancel };
}
