import { Metadata } from 'next';

import PortfolioPage from '@/components/PortfolioPage';

import Contents from './Contents';

export const metadata: Metadata = { title: 'Web Apps' };

export default function WebApps() {
  return <PortfolioPage contents={Contents} />;
}
