import useMousePosition from '@/hooks/useMousePosition';

import styles from './header.module.scss';

export default function NavListBackground() {
  const mousePosition = useMousePosition();

  const backgroundPosition = () => {
    const position = -1.5 * mousePosition.x;
    if (position < -1000) return -1000;
    if (position > 1000) return 1000;
    return position;
  };

  return (
    <div
      className={styles.navListBackground}
      style={{
        backgroundPositionX: `${backgroundPosition()}px`,
      }}
    />
  );
}
