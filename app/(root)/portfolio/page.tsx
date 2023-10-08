import { Metadata } from 'next';

import Menu, { MenuItem } from '@/components/Menu';

export const metadata: Metadata = {
  title: 'Portfolio - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

const items: MenuItem[] = [
  {
    name: 'Web Apps',
    path: '/portfolio/web-apps',
  },
  {
    name: 'Digital Art',
    path: '/portfolio/art',
  },
  {
    name: 'Miscellaneous',
    path: '/portfolio/miscellaneous',
  },
];

export default function Portfolio() {
  return (
    <div className="relative flex h-full w-full justify-start">
      <Menu items={items} useArrow />
    </div>
  );
}
