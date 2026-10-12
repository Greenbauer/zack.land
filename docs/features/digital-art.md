# Digital Art

The Digital Art page: a masonry grid of cards, one per Behance project, each with its cover image and a View Gallery link, read from the Behance API when the page renders.

## Surfaces

- page: `app/(root)/portfolio/art/page.tsx`
- source: `app/(root)/portfolio/art/**`
- source: `components/Card.tsx`
- source: `components/Media.tsx`
- source: `components/Button.tsx`
- source: `utils/request.ts`
- source: `types/index.ts`

## Reach

Portfolio in the header, then Digital Art, opens `/portfolio/art`. View Gallery opens the project on Behance in a new tab.

## Verify

Roles: none; the page is public. Data: the Behance API, with `BEHANCE_API_KEY` set (Vercel, or `.env.local`); without it the grid is empty.

1. With `BEHANCE_API_KEY` set, open `/portfolio/art`: a card per Behance project, each with its cover image, name and View Gallery.
2. Without `BEHANCE_API_KEY` (as in the QAE container), open `/portfolio/art`: the page renders with an empty grid and no error page.

No test covers it.

## Gotchas

- Any failure reaching Behance (no key, a bad key, an outage) is logged on the server and shows an empty grid, not an error, so an empty page on a preview is not proof of a break.
- The QAE workflow starts the site with no `BEHANCE_API_KEY`, so a QAE walk always sees the empty grid.
- The Behance user (`greenbauer`) is written in the request URL in `page.tsx`.
