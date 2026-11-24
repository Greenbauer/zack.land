import { useEffect, useState } from 'react';

import { headMood } from './headMood';

// What `load` fetches, once the story has started (a chapter's cue), so a
// visitor who never reaches it fetches nothing. Null until then, or if it
// fails.
export function useOnceCued<T>(load: () => Promise<T>): T | null {
  const [loaded, setLoaded] = useState<T | null>(null);
  useEffect(() => {
    if (loaded) return;
    const timer = setInterval(() => {
      if (!headMood.cue) return;
      clearInterval(timer);
      load().then(setLoaded, () => {});
    }, 500);
    return () => clearInterval(timer);
  }, [load, loaded]);
  return loaded;
}
