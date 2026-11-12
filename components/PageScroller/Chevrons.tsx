// With reduced motion the chevrons hold still: the first shown, the second
// not.
const ARROW =
  'absolute left-0 top-1/2 opacity-0 ease-in-out motion-safe:animate-arrow-l';
const LINE =
  'absolute -top-6 left-1 block h-12 w-px transform bg-[color:var(--sky-text)]';

// One chevron: its two strokes meeting at the left.
const Chevron = ({
  className,
  delay,
}: {
  className: string;
  delay?: string;
}) => (
  <div
    className={`${ARROW} ${className}`}
    style={delay ? { animationDelay: delay } : undefined}
  >
    <div className={`${LINE} origin-top translate-y-[-32.5%] rotate-[35deg]`} />
    <div
      className={`${LINE} origin-bottom translate-y-[32.5%] rotate-[-35deg]`}
    />
  </div>
);

// Two chevrons pointing left, each fading in and sliding left in turn, over
// and over (one, still, with reduced motion). Turned, they point (and
// slide) any way: ScrollArrows turns them up and down.
export function Chevrons() {
  return (
    <>
      <Chevron className="motion-reduce:opacity-100" />
      <Chevron className="motion-reduce:hidden" delay="1.25s" />
    </>
  );
}
