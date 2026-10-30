// On a phone, More then Less on any post puts it back exactly as it was:
// the same card, its images the same size and in the same place, and More
// back where it was. Then it holds still. Runs against a built site: `npx cypress run --spec
// cypress/e2e/more-less.cy.ts --config baseUrl=http://localhost:3000`.

type Look = { card: number[]; tiles: number[][]; button: string | null };

const box = (el: Element) => {
  const r = el.getBoundingClientRect();
  return [r.left, r.top, r.width, r.height].map(Math.round);
};
const shown = (el: Element) => getComputedStyle(el).display !== 'none';
const moreOrLess = (post: Element) =>
  [...post.querySelectorAll('button')].find(
    (b) => shown(b) && /^(more|less)$/i.test(b.textContent?.trim() ?? ''),
  );
const look = (post: Element): Look => ({
  card: box(post.querySelector('section')!),
  tiles: [...post.querySelectorAll('.collage-tile')].map(box),
  button: moreOrLess(post)?.textContent ?? null,
});

// The browser's note that a ResizeObserver's own change will be seen next
// frame (the line fitting and the card's room settle that way) is not an
// error in the page.
Cypress.on('uncaught:exception', (error) =>
  /ResizeObserver loop/.test(error.message) ? false : undefined,
);

describe('More then Less on a phone', () => {
  for (const page of ['/portfolio/miscellaneous', '/portfolio/web-apps'])
    it(`puts every post on ${page} back as it was`, () => {
      cy.viewport(390, 844);
      cy.visit(page);
      cy.get('html[data-scene-ready]', { timeout: 15000 });
      cy.get('[data-post]').then((posts) => {
        posts.toArray().forEach((post, k) => {
          cy.get('#page').then((scroller) => {
            scroller[0]!.scrollTop = (post as HTMLElement).offsetTop;
          });
          cy.wait(3000);
          cy.then(() => {
            const before = look(post);
            if (before.button !== 'More') return;
            cy.then(() => moreOrLess(post)!.click());
            cy.wait(1200);
            cy.then(() => moreOrLess(post)!.click());
            cy.wait(2500);
            cy.then(() => {
              const after = look(post);
              const name = `post ${k}`;
              expect(after.card, `${name} card`).to.deep.equal(before.card);
              expect(after.button, `${name} button`).to.equal('More');
              expect(after.tiles.length, `${name} tiles`).to.equal(
                before.tiles.length,
              );
              after.tiles.forEach((tile, i) => {
                const was = before.tiles[i]!;
                expect(tile.slice(2), `${name} tile ${i} size`).to.deep.equal(
                  was.slice(2),
                );
                expect(Math.abs(tile[0]! - was[0]!)).to.be.at.most(10);
                expect(Math.abs(tile[1]! - was[1]!)).to.be.at.most(10);
              });
            });
            // And it holds still: no flipping between short and whole.
            cy.then(() => {
              let changes = 0;
              const watch = new MutationObserver((m) => (changes += m.length));
              watch.observe(post, {
                subtree: true,
                attributes: true,
                childList: true,
              });
              cy.wait(2000).then(() => {
                watch.disconnect();
                expect(changes, `post ${k} changes while still`).to.be.at.most(
                  2,
                );
              });
            });
          });
        });
      });
    });
});
