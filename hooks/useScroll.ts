import { useEffect, useState } from 'react';

type UseScroll = {
  startLimit?: number;
};

export default function useScroll(options?: UseScroll) {
  const { startLimit } = options || {};
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScrollEvent = () => {
      if (window.scrollY > (startLimit || 0)) setIsScrolling(true);
      else setIsScrolling(false);
    };
    handleScrollEvent();

    document.addEventListener('scroll', handleScrollEvent);
    return () => document.removeEventListener('scroll', handleScrollEvent);
  }, [startLimit]);

  return { isScrolling };
}
