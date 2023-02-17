import { useEffect, useState } from 'react';

type MousePosition = {
  x: number;
  y: number;
};

export default function useMousePosition() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMoveEvent = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMoveEvent, false);
    return () =>
      document.removeEventListener('mousemove', handleMouseMoveEvent);
  }, []);

  return mousePosition;
}
