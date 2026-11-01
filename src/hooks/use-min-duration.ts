import {useEffect, useRef, useState} from 'react';

export const useMinDuration = (active: boolean, minMs: number): boolean => {
  const [held, setHeld] = useState(active);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (active) {
      startedAtRef.current = Date.now();
      setHeld(true);
      return undefined;
    }
    const remaining = minMs - (Date.now() - startedAtRef.current);
    if (remaining <= 0) {
      setHeld(false);
      return undefined;
    }
    const handle = window.setTimeout(() => setHeld(false), remaining);
    return () => {
      window.clearTimeout(handle);
    };
  }, [active, minMs]);

  return active || held;
};
