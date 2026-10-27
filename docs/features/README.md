# Feature map

One file per user-facing feature of zack.land: what it owns in code, how a visitor reaches it, what proves it works and what tends to go wrong. Before a change, read the files of the features it touches. After it, walk their Verify steps and run their tests, and update the file in the same pull request when the feature changed.

Each file has four sections. **Surfaces** lists the pages and route handlers the feature owns and the source files that implement it. **Reach** is how a visitor gets there. **Verify** is the browser states to walk, then the tests that cover it as `path::exact test title`. **Gotchas** are the traps. The format is Vibe Verifier's (`docs/feature-map.md` in its catalog).

| Feature | Pages and routes |
|---|---|
| [Home and the site frame](home.md) | `/` (and the header, footer, background and 404 on every page) |
| [Portfolio](portfolio.md) | `/portfolio`, `/portfolio/web-apps`, `/portfolio/miscellaneous` |
| [Contact form](contact.md) | `/contact`, `/api/email` |

The site has no sign-in and no roles: every page is public, so Verify names no role. It has no seed data either: the portfolio content is in the repository, and the contact form needs the SMTP variables in `.env.example`.

## Keeping it true

The `feature-map` line in `.vibe-verifier` fails a pull request that adds a page or a route handler no feature lists, lists one that no longer exists, or leaves a source glob or a test anchor pointing at nothing:

```
feature-map --surface page 'app/**/page.tsx' --surface route 'app/**/route.ts'
```

The surfaces come from the code: every tracked `app/**/page.tsx` is a `page` and every tracked `app/**/route.ts` is a `route`. The gate names a surface by its file path, so a feature lists `app/(root)/contact/page.tsx`, not `/contact`; Reach and the table above give the URL. `app/robots.ts`, `app/sitemap.ts` and `app/not-found.tsx` are not page or route files, so the gate does not count them; [home](home.md) lists them as sources.

## Changing the map

- **A new page or route handler** goes under the Surfaces of the feature that serves it, in the same pull request. A new feature gets its own file with the four sections, and a row above.
- **A moved or renamed file, route or test** updates every feature that lists it. The gate names each one.
- **Changed behaviour** updates Reach, the Verify steps and Gotchas. No gate can see that, so the review does.
- **A removed feature** deletes its file and its row. A feature folded into another moves its bullets there.
