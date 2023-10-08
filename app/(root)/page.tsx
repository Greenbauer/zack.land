import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

export default function Page() {
  return (
    <div className="flex h-full w-full items-center justify-end">
      <div className="flex w-full flex-col text-center md:gap-6 lg:max-w-lg lg:text-left">
        <h1>Zack Greenbauer&apos;s</h1>
        <h2>Portfolio and Sandbox</h2>
      </div>
    </div>
  );
}
