import { useEffect, useState } from 'react';

import { headMood } from './headMood';
import { headBesideCard } from './headPlace';

// Whether the story's props may load: once the story has started (a
// chapter's cue) and its card shows with the head on the screen beside it,
// so a visitor who never reaches it, or a phone, where the head steps off
// the screen for every chapter's card, fetches none of them; turned or
// widened so the head stays beside a card, it fetches them then.
export const propsMayLoad = () => !!headMood.cue && headBesideCard.x >= 0;

// What `load` fetches once propsMayLoad, checked twice a second. Null until
// then, or if it fails.
export function useOnceCued<T>(load: () => Promise<T>): T | null {
  const [loaded, setLoaded] = useState<T | null>(null);
  useEffect(() => {
    if (loaded) return;
    const timer = setInterval(() => {
      if (!propsMayLoad()) return;
      clearInterval(timer);
      load().then(setLoaded, () => {});
    }, 500);
    return () => clearInterval(timer);
  }, [load, loaded]);
  return loaded;
}
