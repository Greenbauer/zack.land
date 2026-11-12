import { Metadata } from 'next';

import PortfolioPage from '@/components/PortfolioPage';

import posts from './Contents';

export const metadata: Metadata = { title: 'Miscellaneous' };

export default function Miscellaneous() {
  return <PortfolioPage contents={posts} />;
}
