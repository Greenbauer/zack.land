import { Metadata } from 'next';

import NotFoundVideo from '@/components/NotFound/NotFoundVideo';

// The 404 page, in the site's frame: any unknown path ([...missing]). Its
// title is set here too, so it is in the served HTML (a browser then keeps
// [...missing]'s, the same).
export const metadata: Metadata = { title: '404' };

export default function NotFound() {
  return <NotFoundVideo />;
}
