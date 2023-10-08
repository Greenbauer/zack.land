'use client';

import { useRef, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';

export default function NotFound() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  const handleTogglePlayVideo = (): void => {
    if (videoRef.current) {
      if (isVideoPlaying) videoRef.current.pause();
      else videoRef.current.play();

      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  return (
    <div
      className="container z-0 h-screen cursor-pointer overflow-hidden"
      onClick={handleTogglePlayVideo}
    >
      <div className="m-3 flex max-w-md items-center justify-between gap-3 bg-gray-darkest p-3 md:m-6 md:p-6">
        <h3>404 - Page not found</h3>
        <a>{isVideoPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}</a>
      </div>
      <video
        ref={videoRef}
        className="absolute left-1/2 top-1/2 -z-10 h-full w-auto -translate-x-1/2 -translate-y-1/2 object-cover"
        loop
      >
        <source src="/not-found/hello-is-it-me.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
