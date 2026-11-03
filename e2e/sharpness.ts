import { expect, Page } from '@playwright/test';

type Box = { x: number; y: number; width: number; height: number };

// How sharp what the page draws in each box is: the mean change in
// brightness from each pixel to the next, across and down, read from one
// screenshot of the window (a screenshot waits for a frame, which a
// software-drawn runner can take seconds over). Text and edges score high,
// the same area blurred scores low; the sky behind scores near nothing.
export async function sharpness(page: Page, boxes: Box[]) {
  const png = await page.screenshot();
  return page.evaluate(
    async ([data, boxes]) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      // Screenshot pixels per CSS pixel.
      const scale = image.width / innerWidth;
      return boxes.map((box) => {
        const {
          data: px,
          width,
          height,
        } = context.getImageData(
          Math.round(box.x * scale),
          Math.round(box.y * scale),
          Math.max(1, Math.round(box.width * scale)),
          Math.max(1, Math.round(box.height * scale)),
        );
        const light = (k: number) =>
          px[k]! * 0.3 + px[k + 1]! * 0.59 + px[k + 2]! * 0.11;
        let sum = 0;
        for (let y = 0; y < height - 1; y++)
          for (let x = 0; x < width - 1; x++) {
            const k = (y * width + x) * 4;
            sum += Math.abs(light(k) - light(k + 4));
            sum += Math.abs(light(k) - light(k + width * 4));
          }
        return sum / (width * height);
      });
    },
    [png.toString('base64'), boxes] as const,
  );
}

// The boxes `measure` finds, and the sharpness of each, once the page has
// come in: the sky settled (data-sky-settled, Sky.tsx: until then the text
// may yet turn to the other side's colours, as the sky sets off for it), no
// transition or animation that ends still running but the colour fades, and
// the boxes where they were half a second before. The card, header and
// footer fade in as the page comes in, and on a phone the footer can shrink
// after that (--footer-height), moving what is above it; on a starved runner
// all of it comes late (the scene can take 15 seconds to first draw), and a
// reading taken before is of the wrong place or of a fade, too low to
// compare a blur against. The colours (transitions of --sky-* and --card-*,
// styles/globals.css) follow the sky behind each word, which drifts, so they
// may never all be still: the tests read at rest before and after instead.
// The sky behind never holds still either, so the readings themselves cannot
// be waited on.
export async function restingSharpness<B extends Box>(
  page: Page,
  measure: () => Promise<B[]>,
) {
  let boxes: B[] = [];
  await expect
    .poll(
      async () => {
        const before = JSON.stringify(boxes);
        boxes = await measure();
        const isStill = await page.evaluate(
          () =>
            document.documentElement.hasAttribute('data-sky-settled') &&
            !document
              .getAnimations()
              .some(
                (animation) =>
                  animation.playState === 'running' &&
                  animation.effect?.getComputedTiming().endTime !== Infinity &&
                  !(
                    animation instanceof CSSTransition &&
                    animation.transitionProperty.startsWith('--')
                  ),
              ),
        );
        return isStill && JSON.stringify(boxes) === before;
      },
      { intervals: [500], timeout: 60_000 },
    )
    .toBe(true);
  return { boxes, sharp: await sharpness(page, boxes) };
}
