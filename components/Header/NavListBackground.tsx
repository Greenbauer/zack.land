import { useRef } from 'react';

import useMousePosition from '@/hooks/useMousePosition';

type NavListBackgroundProps = {
  offsetLeft: number;
};

export default function NavListBackground({
  offsetLeft = 0,
}: NavListBackgroundProps) {
  const mousePosition = useMousePosition();
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  const backgroundPosition = (): number => {
    const backgroundWidth = backgroundRef.current?.offsetWidth || 0;
    const position =
      -1.5 * (mousePosition.x - offsetLeft - backgroundWidth / 2);

    if (position < -backgroundWidth) return -backgroundWidth;
    if (position > backgroundWidth) return backgroundWidth;

    return position;
  };

  return (
    <div
      ref={backgroundRef}
      className="bg-gradient absolute left-0 top-0 -z-10 h-full w-full bg-[length:300%_100%]"
      style={{
        transition:
          'transform 0.8s, color 0.3s 0.2s, background-position-x 0.7s',
        transitionDelay: '0s, 0.2s, 0s',
        backgroundPositionX: `${backgroundPosition()}px`,
      }}
    />
  );
}
