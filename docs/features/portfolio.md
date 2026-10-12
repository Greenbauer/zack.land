# Portfolio

The portfolio menu and the two portfolio pages whose content lives in this repository: Web Apps and Miscellaneous, each a column of posts with media, a description and links.

## Surfaces

- page: `app/(root)/portfolio/page.tsx`
- page: `app/(root)/portfolio/web-apps/page.tsx`
- page: `app/(root)/portfolio/miscellaneous/page.tsx`
- source: `app/(root)/portfolio/page.tsx`
- source: `app/(root)/portfolio/web-apps/**`
- source: `app/(root)/portfolio/miscellaneous/**`
- source: `components/Menu/**`
- source: `components/Post.tsx`
- source: `components/Media.tsx`
- source: `components/Button.tsx`
- source: `utils/menu.ts`
- source: `types/index.ts`
- source: `public/web-apps/**`
- source: `public/miscellaneous/**`

## Reach

Portfolio in the header opens `/portfolio`, a menu of Web Apps, Digital Art and Miscellaneous. Web Apps and Miscellaneous list their posts from `Contents.tsx` beside them; on a wide screen a side menu of post names scrolls to each post. A post's Visit Site and View Code open in a new tab.

## Verify

Roles: none; every page is public. Content: the `Contents.tsx` beside each page and the images under `public/`.

1. Open `/portfolio`: the menu offers Web Apps, Digital Art and Miscellaneous, each opening its page.
2. Open `/portfolio/web-apps` at 1280 pixels wide: a post per entry, first "This web site", each with its media and description; choosing a name in the side menu scrolls to that post.
3. Open `/portfolio/web-apps` at 375 pixels wide: the side menu is hidden and the posts stack in one column.
4. Open `/portfolio/miscellaneous`: every post's image, GIF or video loads, with no broken image.

No test that runs covers it: `cypress/e2e/navigation.cy.ts` visits these pages, but its selectors match nothing the components render, and no workflow runs Cypress.

## Gotchas

- A post's media `key` is a path under `public/` or, for a video, a YouTube id; a misspelled path shows a broken image with no error.
- The side menu scrolls by an id made from the post's name (`utils/menu.ts`), so two posts with one name scroll to the same place.
- `Button` and `Media` are shared with [digital-art](digital-art.md), and `Button` with [contact](contact.md).
