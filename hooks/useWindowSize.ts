import { useEffect, useState } from 'react';

type WindowSizeType = {
    width: number;
    height: number;
};

export default (): WindowSizeType => {
    const [windowSize, setWindowSize] = useState<WindowSizeType>({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        function handleResize(): void {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        handleResize();
        window.addEventListener('resize', handleResize);

        return (): void => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};
