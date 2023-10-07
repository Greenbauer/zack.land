export default function Spinner() {
  return (
    <div className="fixed flex h-full w-full items-center justify-center">
      <div className="relative m-12 h-60 w-60 animate-spin rounded-full border border-gray-dark border-l-white" />
    </div>
  );
}
