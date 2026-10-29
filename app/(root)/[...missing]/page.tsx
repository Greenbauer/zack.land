import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: '404 - Zack Greenbauer',
};

// Any path the site has no page for: the 404 page (../not-found.tsx), shown
// in the site's frame, with the 3D head, header and footer.
export default function Missing() {
  notFound();
}
