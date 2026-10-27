import { useEffect, useRef } from 'react';

// The gradient behind a hovered nav link slides against the pointer: a nav
// list takes `ref`, and its links read the slide from its `--nav-x`, written
// on each pointer move without re-rendering.
export default function useGradientShift(offsetLeft = 0) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const shift = ({ clientX }: MouseEvent) => {
      const list = ref.current;
      if (!list) return;
      const width = list.offsetWidth;
      const position = -1.5 * (clientX - offsetLeft - width / 2);
      const clamped = Math.min(Math.max(position, -width), width);
      list.style.setProperty('--nav-x', `${clamped}px`);
    };
    document.addEventListener('mousemove', shift);
    return () => document.removeEventListener('mousemove', shift);
  }, [offsetLeft]);

  return ref;
}
