import { afterEach, describe, expect, it, vi } from 'vitest';

import { WIDE_FROM } from './PageScroller/edgeFade';
import {
  isShowing,
  isStill,
  isWide,
  REDUCED_MOTION,
  watchSize,
} from './viewport';

afterEach(() => vi.unstubAllGlobals());

describe('isStill', () => {
  it('asks the reduced-motion query', () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === REDUCED_MOTION,
    }));
    vi.stubGlobal('matchMedia', matchMedia);
    expect(isStill()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('is false when motion is not reduced', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(isStill()).toBe(false);
  });
});

describe('isWide', () => {
  it('is true from WIDE_FROM up, false below it', () => {
    vi.stubGlobal('innerWidth', WIDE_FROM);
    expect(isWide()).toBe(true);
    vi.stubGlobal('innerWidth', WIDE_FROM - 1);
    expect(isWide()).toBe(false);
  });
});

describe('isShowing', () => {
  it("asks the browser's checkVisibility where there is one", () => {
    const checkVisibility = vi.fn(() => false);
    const element = { checkVisibility, getClientRects: () => [{}] };
    expect(isShowing(element as never as Element)).toBe(false);
    expect(checkVisibility).toHaveBeenCalled();
  });

  // Older Safari has no checkVisibility: the home page's hint called it
  // regardless, and threw (audit B8).
  it('without checkVisibility, goes by whether it has a box', () => {
    const shown = { getClientRects: () => [{}] };
    const hidden = { getClientRects: () => [] };
    expect(isShowing(shown as never as Element)).toBe(true);
    expect(isShowing(hidden as never as Element)).toBe(false);
  });
});

describe('watchSize', () => {
  // A ResizeObserver that notes what it watches and fires when told.
  function fakeObserver() {
    const watched: Element[] = [];
    let fire = () => {};
    let disconnected = false;
    class FakeResizeObserver {
      constructor(callback: () => void) {
        fire = callback;
      }
      observe(element: Element) {
        watched.push(element);
      }
      disconnect() {
        disconnected = true;
      }
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    return { watched, fire: () => fire(), isDisconnected: () => disconnected };
  }

  it('measures at once, then on each change of size, until stopped', () => {
    const observer = fakeObserver();
    const a = {} as Element;
    const b = {} as Element;
    const measure = vi.fn();
    const stop = watchSize([a, b], measure);
    expect(measure).toHaveBeenCalledTimes(1);
    expect(observer.watched).toEqual([a, b]);
    observer.fire();
    expect(measure).toHaveBeenCalledTimes(2);
    stop();
    expect(observer.isDisconnected()).toBe(true);
  });

  it('follows the window only when asked, and stops following it', () => {
    fakeObserver();
    const add = vi.fn();
    const remove = vi.fn();
    vi.stubGlobal('addEventListener', add);
    vi.stubGlobal('removeEventListener', remove);
    const measure = () => {};
    watchSize([], measure)();
    expect(add).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    watchSize([], measure, true)();
    expect(add).toHaveBeenCalledWith('resize', measure);
    expect(remove).toHaveBeenCalledWith('resize', measure);
  });
});
