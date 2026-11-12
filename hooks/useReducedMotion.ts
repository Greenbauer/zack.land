import { useSyncExternalStore } from 'react';

import { isStill, REDUCED_MOTION as QUERY } from '@/components/viewport';

// Whether the visitor asks for reduced motion, kept live (the setting can
// change while the page is open); false on the server.

const subscribe = (change: () => void) => {
  const query = matchMedia(QUERY);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export default function useReducedMotion() {
  return useSyncExternalStore(subscribe, isStill, () => false);
}
