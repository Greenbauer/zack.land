'use client';

import { useEffect, useRef } from 'react';

import { headMood } from '@/components/Background/headMood';
import { propTarget } from '@/components/Background/storyProp';
import useReducedMotion from '@/hooks/useReducedMotion';

// The pulse jet's bang (components/Home/chapters.ts, Texas Tech): a warm
// flash over the whole window for a moment, as the head flinches. Not with
// reduced motion.
export default function StoryFlash() {
  const ref = useRef<HTMLDivElement | null>(null);
  const isStill = useReducedMotion();

  useEffect(() => {
    if (isStill) return;
    let frame = 0;
    const step = () => {
      const strength = propTarget(
        headMood.cue,
        'bang',
        performance.now() / 1000,
      );
      if (ref.current) ref.current.style.opacity = String(strength * 0.5);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isStill]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 bg-head-light opacity-0"
    />
  );
}
