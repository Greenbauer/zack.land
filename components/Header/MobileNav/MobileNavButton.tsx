import { cva } from 'class-variance-authority';
import { ForwardedRef, forwardRef } from 'react';

const lineStyle = cva(
  'absolute block h-px w-full bg-white transition-all duration-200 ease-in-out',
  {
    variants: {
      isActive1: {
        false: 'left-0 top-0 opacity-100 ',
        true: 'top-3 rotate-[135deg] opacity-100 ',
      },
      isActive2: {
        false: 'left-0 top-3 opacity-100',
        true: '-left-16 top-3 opacity-0',
      },
      isActive3: {
        false: 'left-0 top-6 opacity-100 ',
        true: 'top-3 rotate-[-135deg] opacity-100',
      },
    },
  },
);

type MobileNavButtonProps = {
  isActive: boolean;
};

function MobileNavButton(
  { isActive, ...props }: MobileNavButtonProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      className="relative z-10 mt-4 inline-block h-10 w-10 cursor-pointer transition-transform duration-500 ease-in-out"
      {...props}
    >
      <span className={lineStyle({ isActive1: isActive })} />
      <span className={lineStyle({ isActive2: isActive })} />
      <span className={lineStyle({ isActive3: isActive })} />
    </div>
  );
}

export default forwardRef(MobileNavButton);
