import miscellaneous from './miscellaneous/Contents';
import webApps from './web-apps/Contents';

// The portfolio's pages, each a list of posts (its Contents.tsx), shown by
// components/PortfolioPage.tsx; the sitemap lists them with their photos
// (app/sitemap.ts).
export const PORTFOLIO_PAGES = [
  { path: '/portfolio/web-apps', contents: webApps },
  { path: '/portfolio/miscellaneous', contents: miscellaneous },
];
