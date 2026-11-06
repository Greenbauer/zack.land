import { describe, expect, it } from 'vitest';

import { ACTIVITY, MousePosition, watchPointer } from './useMousePosition';

const still = (): MousePosition => ({
  x: 10,
  y: 20,
  moved: false,
  left: false,
});

describe('noticing someone on the page', () => {
  it.each(ACTIVITY)(
    'counts a %s as activity, leaving the pointer where it was',
    (type) => {
      const page = new EventTarget();
      const position = still();
      const stop = watchPointer(page, position);
      page.dispatchEvent(new Event(type));
      expect(position).toEqual({ ...still(), moved: true });
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

// A mouse event of `type` that MouseEvent's fields can be read from.
const mouseEvent = (type: string, fields: object) =>
  Object.assign(new Event(type), fields);

describe('noticing the pointer leave the window', () => {
  it('marks it gone when it goes out onto nothing, and back when it moves', () => {
    const page = new EventTarget();
    const position = still();
    const stop = watchPointer(page, position);
    page.dispatchEvent(mouseEvent('mouseout', { relatedTarget: null }));
    expect(position.left).toBe(true);
    // Leaving is not using the page: the idle clock runs on.
    expect(position.moved).toBe(false);
    page.dispatchEvent(mouseEvent('mousemove', { clientX: 5, clientY: 6 }));
    expect(position).toEqual({ x: 5, y: 6, moved: true, left: false });
    stop();
  });

  it('does not count moving from one part of the page onto another', () => {
    const page = new EventTarget();
    const position = still();
    const stop = watchPointer(page, position);
    page.dispatchEvent(mouseEvent('mouseout', { relatedTarget: page }));
    expect(position.left).toBe(false);
    stop();
  });
});
