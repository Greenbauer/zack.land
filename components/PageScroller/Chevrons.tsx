import { cva } from 'class-variance-authority';

const arrowStyle = cva('absolute left-0 top-1/2 opacity-0 ease-in-out', {
  variants: {
    intent: {
      first: 'animate-arrow-l',
      last: 'animate-arrow-l',
    },
  },
});

const arrowLineStyle = cva(
  'absolute -top-6 left-1 block h-12 w-px bg-[color:var(--sky-text)]',
  {
    variants: {
      intent: {
        top: 'origin-top translate-y-[-32.5%] rotate-[35deg] transform',
        bottom: 'origin-bottom translate-y-[32.5%] rotate-[-35deg] transform',
      },
    },
  },
);

// Two chevrons pointing left, each fading in and sliding left in turn, over
// and over. Turned, they point (and slide) any way: ScrollArrows turns them
// up and down.
export function Chevrons() {
  return (
    <>
      <div className={arrowStyle({ intent: 'first' })}>
        <div className={arrowLineStyle({ intent: 'top' })} />
        <div className={arrowLineStyle({ intent: 'bottom' })} />
      </div>
      <div
        className={arrowStyle({ intent: 'last' })}
        style={{ animationDelay: '1.25s' }}
      >
        <div className={arrowLineStyle({ intent: 'top' })} />
        <div className={arrowLineStyle({ intent: 'bottom' })} />
      </div>
    </>
  );
}
