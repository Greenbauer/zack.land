'use client';

import { Component, ReactNode } from 'react';

// Where the scene cannot start (no WebGL: the browser has it off, or cannot
// make a context), it is left out rather than failing the whole page: the
// page opens on the scene's lavender ground at once (`onFail`), and its
// titles show as text (styles/globals.css).
export default class SceneBoundary extends Component<
  { children: ReactNode; onFail: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('The 3D scene could not start:', error);
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
