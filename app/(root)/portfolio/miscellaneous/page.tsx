import { Metadata } from 'next';

import PortfolioPage from '@/components/PortfolioPage';

import Contents from './Contents';

export const metadata: Metadata = { title: 'Miscellaneous' };

export default function Miscellaneous() {
  return <PortfolioPage contents={Contents} />;
}
