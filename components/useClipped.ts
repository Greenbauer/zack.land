import { RefObject, useEffect, useState } from 'react';

import { watchSize } from './viewport';

// Whether the box `ref` points at is cut short: its content is taller than
// the box, which hides the rest (overflow: hidden) rather than scrolling it
// (Post.tsx shows More then). Checked again whenever the box or one of its
// children changes size, while `isMeasured`: an opened card shows all its
// text, so while it is open the answer from before is kept, and More is
// there at once as Less closes it (useMoreMotion measures the closed card).
export default function useClipped(
  ref: RefObject<HTMLElement | null>,
  isMeasured = true,
) {
  const [isClipped, setIsClipped] = useState(false);

  useEffect(() => {
    const box = ref.current;
    if (!box || !isMeasured) return;
    const measure = () => setIsClipped(box.scrollHeight > box.clientHeight + 1);
    return watchSize([box, ...box.children], measure);
  }, [ref, isMeasured]);

  return isClipped;
}
