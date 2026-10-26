# Home and the site frame

The home page and what surrounds every page: the header navigation, the footer with its contact line and social links, the 3D background, the 404 page, and the site's metadata, `robots.txt` and sitemap.

## Surfaces

- page: `app/(root)/page.tsx`
- source: `app/(root)/page.tsx`
- source: `app/(root)/layout.tsx`
- source: `app/layout.tsx`
- source: `app/not-found.tsx`
- source: `app/robots.ts`
- source: `app/sitemap.ts`
- source: `components/Header/**`
- source: `components/Footer/**`
- source: `components/Background/**`
- source: `hooks/**`
- source: `styles/globals.css`
- source: `tailwind.config.js`
- source: `public/background/**`
- source: `public/brand/**`
- source: `public/not-found/**`
- source: `public/favicon.ico`

## Reach

`/`. The header links Home, Portfolio and Contact on a wide screen, and behind the menu button on a narrow one; every other page shows its title in the header. The footer's Contact me link opens `/contact`. Any unknown path shows the 404 page with a video that plays on click.

## Verify

Roles: none; every page is public. No seed data: the pages render what the repository holds.

1. Open `/` at 1280 pixels wide: "Zack Greenbauer's" and "Portfolio and Sandbox" sit over the 3D background, the header shows Home, Portfolio and Contact, and the footer has the Contact me link and the social links.
2. Open `/` at 375 pixels wide: the menu button opens Home, Portfolio and Contact, and choosing Portfolio opens `/portfolio` with Portfolio in the header.
3. Open `/no-such-page`: "404 - Page not found" shows; clicking the page plays the video, and clicking again pauses it.
4. Open `/sitemap.xml` and `/robots.txt`: the sitemap lists the home page, the four portfolio pages and Contact; robots allows everything and names the sitemap.

No test that runs covers it: `cypress/e2e/navigation.cy.ts` walks these pages, but it selects `.navbar`, `.section` and `.card`, which no component renders, and no workflow runs Cypress.

## Gotchas

- The header's titles come from the `routes` list in `components/Header/index.tsx`, and the sitemap from the list in `app/sitemap.ts`. Both are kept by hand: a new page needs an entry in each.
- The site URL `https://www.zack.land` is written in `app/layout.tsx`, `app/robots.ts` and `app/sitemap.ts`.
- The background is three.js (`@react-three/fiber`); it renders on every page, so a change to it is a change to all of them.
- The background's look is pmndrs' "Color grading" sandbox (codesandbox.io/p/sandbox/wvgxp): a glossy black head with eyes in `#aca8a3`, the blurred dawn HDR as the sky, and the `cubicle-99` LUT on top (`components/Background/Grading.tsx`). Both files are served from `public/background/environment/`, not drei's CDN.
- Vercel Analytics loads on every page; the QAE gates declare its script as the one expected console and network error.
