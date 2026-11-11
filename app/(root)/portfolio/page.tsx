import { permanentRedirect } from 'next/navigation';

// The portfolio's pages are offered in the header's Portfolio dropdown, so
// /portfolio itself has nothing of its own: it goes to the first of them, for
// good (308), so search engines index that page instead.
export default function Portfolio() {
  permanentRedirect('/portfolio/web-apps');
}
