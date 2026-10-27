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
- source: `components/postGallery.ts`
- source: `components/Button.tsx`
- source: `utils/menu.ts`
- source: `types/index.ts`
- source: `public/web-apps/**`
- source: `public/miscellaneous/**`

## Reach

Portfolio in the header opens `/portfolio`, a menu of Web Apps and Miscellaneous. Web Apps and Miscellaneous list their posts from `Contents.tsx` beside them; on a wide screen a side menu of post names scrolls to each post. A post's Visit Site and View Code open in a new tab. Buttons take the head's colours, sampled from its rendered skin: its brightest highlight at rest, sweeping fast through peach, rose, purple and deep blue to its near-black navy on hover, flat with rounded corners (`.bg-gradient-button` in `styles/globals.css`). On a wide screen each post is one full page: it fills the space between the header's and the footer's fades, its images in a fixed gallery beside its text (`components/postGallery.ts` lays out one to four images), and each post has big rounded corners. One turn of the wheel (or one trackpad swipe, its glide included) or one press of an arrow, Page Up or Down or space glides straight to the next or previous post in about a third of a second (`components/PageScroller/SnapPager.tsx`, logic in `paging.ts`, tested by `paging.test.ts`); text that can still scroll inside a post scrolls first. On a short screen (800 pixels tall or less) the text is set smaller so the longest post still fits. On a phone the fades are shorter, each post still fills one screen with its gallery above its text, and a post with images shows four lines of its description and hides the rest, with its technology, behind More; More gives the whole post to the text and Less brings the images back.

## Verify

Roles: none; every page is public. Content: the `Contents.tsx` beside each page and the images under `public/`.

1. Open `/portfolio`: the menu offers Web Apps and Miscellaneous, each opening its page.
2. Open `/portfolio/web-apps` at 1280 by 720: a post per entry, first "This web site", each with its media and description and none cut off; one scroll moves to the next post, and choosing a name in the side menu scrolls to that post.
3. On `/portfolio/web-apps` at 1440 by 900, one notch of the mouse wheel lands squarely on the next post with no pause, and one swipe on a trackpad moves exactly one post.
4. Open `/portfolio/miscellaneous` at 375 by 812: the side menu is hidden, each post fits on one screen and one swipe moves to the next; More on Smart Bed shows its whole description and Less brings its images back.
5. Open `/portfolio/miscellaneous`: every post's image, GIF or video loads, with no broken image.

The gallery layout is covered by `components/postGallery.test.ts`. No test that runs covers the pages: `cypress/e2e/navigation.cy.ts` visits these pages, but its selectors match nothing the components render, and no workflow runs Cypress.

## Gotchas

- A post's media `key` is a path under `public/` or, for a video, a YouTube id; a misspelled path shows a broken image with no error.
- The side menu scrolls by an id made from the post's name (`utils/menu.ts`), so two posts with one name scroll to the same place.
- `Button` and `Media` are shared with [digital-art](digital-art.md), and `Button` with [contact](contact.md).
