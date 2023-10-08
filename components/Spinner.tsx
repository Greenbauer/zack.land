import { cva, VariantProps } from 'class-variance-authority';

const spinnerStyle = cva(
  'relative animate-spin rounded-full border border-gray-dark border-l-white',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        xl: 'h-60 w-60',
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
