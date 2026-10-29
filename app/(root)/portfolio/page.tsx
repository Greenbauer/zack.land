import { redirect } from 'next/navigation';

// The portfolio's pages are offered in the header's Portfolio dropdown, so
// /portfolio itself has nothing of its own: it goes to the first of them.
export default function Portfolio() {
  redirect('/portfolio/web-apps');
}
