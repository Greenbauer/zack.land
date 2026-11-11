import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// The title once the page has loaded; ../not-found.tsx sets the same in the
// served HTML, since this page calls notFound() before its own metadata is
// written there.
export const metadata: Metadata = { title: '404' };

// Any path the site has no page for: the 404 page (../not-found.tsx), shown
// in the site's frame, with the 3D head, header and footer.
export default function Missing() {
  notFound();
}
