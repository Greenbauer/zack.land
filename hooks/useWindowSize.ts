import { useEffect, useState } from 'react';

type WindowSize = {
  width: number;
  height: number;
};

export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResizeEvent(): void {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    handleResizeEvent();

    window.addEventListener('resize', handleResizeEvent);
    return (): void => window.removeEventListener('resize', handleResizeEvent);
  }, []);

  return windowSize;
}
