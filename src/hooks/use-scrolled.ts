import {useEffect, useState} from 'react';

export const useScrolled = (): boolean => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled((document.scrollingElement?.scrollTop ?? 0) > 0);
    update();
    window.addEventListener('scroll', update, {passive: true});
    return () => window.removeEventListener('scroll', update);
  }, []);

  return scrolled;
};
