import { Metadata } from 'next';

import PortfolioPage from '@/components/PortfolioPage';

import posts from './Contents';

export const metadata: Metadata = { title: 'Web Apps' };

export default function WebApps() {
  return <PortfolioPage contents={posts} />;
}
