import { useRef } from 'react';

import useMousePosition from '@/hooks/useMousePosition';

import styles from './header.module.scss';

type NavListBackgroundType = {
  offsetLeft: number;
};

export default function NavListBackground({
  offsetLeft = 0,
}: NavListBackgroundType) {
  const mousePosition = useMousePosition();
  const backgroundRef = useRef<any>(null);

  const backgroundPosition = () => {
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
      className={styles.navListBackground}
      style={{
        backgroundPositionX: `${backgroundPosition()}px`,
      }}
    />
  );
}
