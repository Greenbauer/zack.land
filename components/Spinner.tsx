const SIZE = { sm: 'size-8', xl: 'size-60' };

export default function Spinner({ size = 'xl' }: { size?: keyof typeof SIZE }) {
  return (
    <div
      className={`relative animate-spin rounded-full border border-head-light/20 border-l-head-light ${SIZE[size]}`}
    />
  );
}
