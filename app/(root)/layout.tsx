import { ReactElement } from 'react';

type LayoutProps = {
  children: ReactElement;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <div className="container z-0 mx-3 flex flex-col">
        <main className="flex flex-1">
          <div className="relative flex flex-1 pb-6 pt-24 md:pb-12 md:pt-36">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
