'use client';

import { createContext, useContext } from 'react';

// What the home page's story shares with its parts (Story.tsx): the chapter
// in view (`index` into CHAPTERS, -1 for the opening with the name), when its
// lines start (`since`, seconds, performance.now() / 1000), and whether
// Watch is playing it.
export type StoryState = {
  index: number;
  since: number;
  isWatching: boolean;
  setWatching: (_watching: boolean) => void;
};

export const StoryContext = createContext<StoryState>({
  index: -1,
  since: 0,
  isWatching: false,
  setWatching: () => {},
});

export const useStory = () => useContext(StoryContext);
