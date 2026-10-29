import { describe, expect, it } from 'vitest';

import { ACTIVITY, MousePosition, watchPointer } from './useMousePosition';

const still = (): MousePosition => ({ x: 10, y: 20, moved: false });

describe('noticing someone on the page', () => {
  it.each(ACTIVITY)(
    'counts a %s as activity, leaving the pointer where it was',
    (type) => {
      const page = new EventTarget();
      const position = still();
      const stop = watchPointer(page, position);
      page.dispatchEvent(new Event(type));
      expect(position).toEqual({ x: 10, y: 20, moved: true });
      stop();
    },
  );

  it('counts scrolling inside the page, which does not bubble, by listening in the capture phase', () => {
    const page = new EventTarget();
    const added: [string, unknown][] = [];
    const add = page.addEventListener.bind(page);
    page.addEventListener = (type, listener, options) => {
      added.push([type, options]);
      add(type, listener, options);
    };
    const stop = watchPointer(page, still());
    expect(added).toContainEqual([
      'scroll',
      expect.objectContaining({ capture: true }),
    ]);
    stop();
  });

  it('stops noticing once stopped', () => {
    const page = new EventTarget();
    const position = still();
    watchPointer(page, position)();
    for (const type of ACTIVITY) page.dispatchEvent(new Event(type));
    expect(position.moved).toBe(false);
  });
});
