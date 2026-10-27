import { cva, VariantProps } from 'class-variance-authority';

const spinnerStyle = cva(
  'relative animate-spin rounded-full border border-head-light/20 border-l-head-light',
  {
    variants: {
      size: {
        sm: 'size-8',
        xl: 'size-60',
      },
    },
    defaultVariants: {
      size: 'xl',
    },
  },
);

export default function Spinner({ size }: VariantProps<typeof spinnerStyle>) {
  return <div className={spinnerStyle({ size })} />;
}
