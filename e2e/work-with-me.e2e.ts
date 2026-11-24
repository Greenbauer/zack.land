import { expect as expectNow, Page, test } from '@playwright/test';

// The Work with me page (app/(root)/work-with-me): reached from the header,
// it shows the offer and its price, and its two-field form posts a build
// request to /api/email. Against a built site: `npx playwright test
// e2e/work-with-me`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

test.use({ viewport: { width: 1280, height: 800 } });

const opened = async (page: Page, path: string) => {
  await page.goto(path);
  await page
    .locator('html[data-page-in]')
    .waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(1500);
};

test('the header links to the page, which shows the offer and its price', async ({
  page,
}) => {
  await opened(page, '/');
  await page.getByRole('link', { name: 'Work with me', exact: true }).click();
  await page.waitForURL('**/work-with-me');

  await expect(page.locator('h1')).toHaveText('Work With Me', {
    ignoreCase: true,
  });
  await expect(
    page.getByRole('heading', {
      name: 'I build AI tools that handle the repetitive work for small teams',
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Done for you, checked by you before anything goes out, and kept running.',
    ),
  ).toBeVisible();
  // The free first step, and who does the work.
  await expect(
    page.getByRole('link', { name: 'Get a free draft' }),
  ).toHaveAttribute('href', '#ask');
  await expect(
    page.getByText(
      "Tell me what your team does over and over. If I can help, I'll ask for one real example, like a quote you wrote or a form you retype, and show you a draft built from it within 3 working days, before you pay anything.",
    ),
  ).toBeAttached();
  // The button lands on the form's heading of the same name.
  await expect(
    page.getByRole('heading', { name: 'Get a free draft' }),
  ).toHaveAttribute('id', 'ask');
  await expect(
    page.getByText(
      "I'm Zack Greenbauer, a software engineer for 10+ years. Right now I lead AI agent work at a distribution company. You deal with me, start to finish.",
    ),
  ).toBeAttached();
  // Both tasks, quotes first, each as today and after.
  await expect(page.locator('article h4')).toHaveText([
    'Same-day quotes',
    'Stop retyping',
  ]);
  await expect(
    page.getByText(
      'Send the notes or a voice memo. A drafted quote, priced from your own price list, comes back for you to check and send.',
    ),
  ).toBeAttached();
  await expect(
    page.getByText(
      'Details from forms, PDFs and emails get entered once. Anything unclear waits for you.',
    ),
  ).toBeAttached();
  await expect(
    page.getByText(
      'Site-walk notes sit until someone has time to type up the quote.',
    ),
  ).toBeAttached();
  await expect(
    page.getByText(
      'The same customer details get typed into the calendar, the estimate and the invoice.',
    ),
  ).toBeAttached();
  // How it works, in four steps.
  await expect(page.locator('article ol > li')).toHaveText([
    'Send one real example. A quote you wrote, or a form your team retypes. Free.',
    'See a draft built from it within 3 working days.',
    "If it's useful, I set it up in two weeks. You approve every draft before it goes out.",
    'I keep it running. Fixes, updates when your prices or forms change, and a short call each month.',
  ]);
  // The price, all in.
  await expect(page.getByText('$3,500 setup')).toHaveCount(1);
  await expect(
    page.getByText(
      "Half to start, half once you've approved its first real drafts.",
    ),
  ).toBeAttached();
  await expect(page.getByText('$500 a month', { exact: true })).toBeAttached();
  await expect(
    page.getByText(
      'Covers fixes, updates and the AI and hosting costs. No other bills.',
    ),
  ).toBeAttached();
  await expect(
    page.getByText(
      "Cancel anytime with 30 days' notice. You keep your price list, templates and every quote.",
    ),
  ).toBeAttached();
  await expect(
    page.getByText(
      'The first two businesses get the setup free. In return I publish a short write-up of what changed, with your business named, and you read it before it goes up.',
    ),
  ).toBeAttached();
  // The owners' questions open to their answers.
  const data = page.getByText("Who sees my customers' details?");
  await data.click();
  await expect(
    page.getByText(
      "Only you and me. The AI service I use works under business terms that don't let it train on your data.",
    ),
  ).toBeVisible();
  await expect(page.locator('article details')).toHaveCount(5);
  await expect(
    page.getByText(
      "I've spent 10+ years building the apps customers use and the internal tools teams run on.",
      { exact: false },
    ),
  ).toBeAttached();
  await expect(page.getByRole('link', { name: 'See my work' })).toHaveAttribute(
    'href',
    '/portfolio',
  );
  await expect(
    page.getByRole('link', { name: 'Vibe Verifier on GitHub' }),
  ).toHaveAttribute('href', 'https://github.com/Greenbauer/vibe-verifier');

  // The first step's button brings the form into view.
  const email = page.getByLabel('Your email');
  await expect(email).not.toBeInViewport();
  await page.getByRole('link', { name: 'Get a free draft' }).click();
  await expect(email).toBeInViewport();
});

test('sends a build request with the email and the answer, then says so', async ({
  page,
}) => {
  let body: Record<string, unknown> = {};
  await page.route('/api/email', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { message: 'Email sent successfully' } });
  });
  await opened(page, '/work-with-me');

  const submit = page.getByRole('button', { name: 'Send', exact: true });
  await expect(submit).toBeDisabled();
  await page.getByLabel('Your email').fill('lead@example.com');
  await expect(submit).toBeDisabled();
  await page
    .getByLabel('What does your team do over and over?')
    .fill('Turn site walks into quotes');
  await expect(submit).toBeEnabled();

  await submit.click();
  await expect(page.getByRole('status')).toHaveText(
    "Thanks. I'll reply by email with where to send your example.",
  );
  expect(body).toMatchObject({
    kind: 'build',
    email: 'lead@example.com',
    message: 'Turn site walks into quotes',
  });
  expect(body).not.toHaveProperty('name');
});

test('says so when the request fails, keeping the button', async ({ page }) => {
  await page.route('/api/email', (route) =>
    route.fulfill({ status: 500, json: { error: 'Failed to send email' } }),
  );
  await opened(page, '/work-with-me');

  await page.getByLabel('Your email').fill('lead@example.com');
  await page
    .getByLabel('What does your team do over and over?')
    .fill('Turn site walks into quotes');
  const submit = page.getByRole('button', { name: 'Send', exact: true });
  await submit.click();

  await expect(page.getByRole('status')).toHaveText('An error has occurred');
  await expect(submit).toBeVisible();
});

test('the footer speaks to each audience, and here jumps to the form', async ({
  page,
}) => {
  const footer = page.getByRole('contentinfo');

  // Every page but Work with me and Contact: a home and a portfolio page.
  for (const path of ['/', '/portfolio/web-apps']) {
    await opened(page, path);
    await expect(footer).toContainText(
      'Hiring a developer, or have a task that repeats?',
    );
    await expect(
      footer.getByRole('link', { name: 'Get in touch', exact: true }),
    ).toHaveAttribute('href', '/contact');
  }

  await opened(page, '/work-with-me');
  await expect(footer).toContainText(
    'Have a task your team does over and over?',
  );
  // The form starts below the window, and the link brings it into view.
  const email = page.getByLabel('Your email');
  await expect(email).not.toBeInViewport();
  await footer
    .getByRole('link', { name: 'Tell me about it', exact: true })
    .click();
  await expect(email).toBeInViewport();
});

test('the video plays once, muted, as the page opens, and its button pauses and replays it', async ({
  page,
}) => {
  // Where the video was as the dark screen over a first visit went
  // (data-page-in): it waits for that rather than playing under it.
  await page.addInitScript(() =>
    document.addEventListener('DOMContentLoaded', () => {
      const html = document.documentElement;
      const seen = new MutationObserver(() => {
        if (!html.hasAttribute('data-page-in')) return;
        seen.disconnect();
        html.dataset.videoAtPageIn = String(
          document.querySelector<HTMLVideoElement>('article video')
            ?.currentTime,
        );
      });
      seen.observe(html, { attributes: true });
    }),
  );
  await opened(page, '/work-with-me');
  const video = page.locator('article video');
  expect(
    Number(await page.locator('html').getAttribute('data-video-at-page-in')),
  ).toBeLessThan(0.5);
  await expect(video).toHaveAttribute('src', '/work-with-me/offer.mp4');
  await expect(video).toHaveAttribute('poster', '/work-with-me/offer.jpg');
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  // Every word is on screen, and the same story is there in words.
  await expect(page.locator('#offer-video-story')).toContainText(
    'A 40-second video with no sound.',
  );
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.5);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.loop))
    .toBe(false);

  await page.getByRole('button', { name: 'Pause the video' }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await expect(
    page.getByRole('button', { name: 'Play the video' }),
  ).toBeVisible();

  // At the end it stops, and its button plays it again from the start.
  await video.evaluate((v: HTMLVideoElement) => {
    v.currentTime = v.duration - 0.2;
    return v.play();
  });
  const again = page.getByRole('button', { name: 'Play the video again' });
  await expect(again).toBeVisible();
  await again.click();
  await expect
    .poll(() =>
      video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime < 5),
    )
    .toBe(true);
});

test('with reduced motion the video waits for its button', async ({
  browser,
}) => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await opened(page, '/work-with-me');
  const video = page.locator('article video');
  await page.waitForTimeout(2000);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await page.getByRole('button', { name: 'Play the video' }).click();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(false);
  await page.close();
});

test.describe('on a 1440x900 laptop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the video is as big as the 404 page's, and shows whole above the footer's fade", async ({
    page,
  }) => {
    await opened(page, '/work-with-me');
    const video = page.locator('article figure');
    await expect(video).toBeInViewport({ ratio: 1 });
    // The footer's fade starts --page-bottom above the window's bottom.
    expect(
      await video.evaluate((figure) => {
        const probe = document.createElement('div');
        probe.style.height = 'var(--page-bottom)';
        figure.parentElement!.append(probe);
        const fade = innerHeight - probe.offsetHeight;
        probe.remove();
        return fade - figure.getBoundingClientRect().bottom;
      }),
    ).toBeGreaterThanOrEqual(0);
    const width = (await video.boundingBox())!.width;
    await opened(page, '/no-such-page');
    const notFound = (await page.locator('.collage').boundingBox())!.width;
    expect(Math.round(width)).toBe(Math.round(notFound));
    expect(width).toBeGreaterThan(700);
  });
});

test('the price stands out from its heading, a line starts each part, and no link splits over two lines', async ({
  page,
}) => {
  await opened(page, '/work-with-me');
  const size = (text: string) =>
    page
      .getByText(text, { exact: true })
      .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  const heading = await size('Price, all in');
  expect(await size('$3,500')).toBeGreaterThan(heading * 2);
  expect(await size('$500')).toBeGreaterThan(heading * 2);
  // Task names are smaller than the headings and not in capitals.
  const task = page.getByRole('heading', { name: 'Same-day quotes' });
  expect(await size('Same-day quotes')).toBeLessThan(heading);
  await expect(task).toHaveCSS('text-transform', 'none');
  const parts = page.locator('article > div:has(> h3)');
  await expect(parts).toHaveCount(6);
  for (const part of await parts.all())
    await expect(part).toHaveCSS('border-top-width', '1px');
  for (const width of [1440, 1280, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 800 });
    for (const name of ['See my work', 'Vibe Verifier on GitHub'])
      expect(
        await page
          .getByRole('link', { name })
          .evaluate((a) => a.getClientRects().length),
        `${name} at ${width}px`,
      ).toBe(1);
  }
});

test("the draft button looks and sweeps on hover as the site's buttons do, and the question is a text box", async ({
  page,
}) => {
  await opened(page, '/work-with-me');
  const look = (button: ReturnType<typeof page.locator>) =>
    button.evaluate((e) => {
      const { backgroundImage, backgroundSize, padding, borderRadius } =
        getComputedStyle(e);
      return { backgroundImage, backgroundSize, padding, borderRadius };
    });
  const draft = page.getByRole('link', { name: 'Get a free draft' });
  expect(await look(draft)).toEqual(
    await look(page.getByRole('button', { name: 'Send' })),
  );
  const state = () =>
    draft.evaluate((e) => {
      const { backgroundPositionX, color } = getComputedStyle(e);
      return { backgroundPositionX, color };
    });
  const rest = await state();
  await draft.hover();
  await expect
    .poll(async () => {
      const now = await state();
      return (
        now.color !== rest.color &&
        /^(0px|0%|100%)$/.test(now.backgroundPositionX) &&
        now.backgroundPositionX !== rest.backgroundPositionX
      );
    })
    .toBe(true);
  await expect(
    page.getByLabel('What does your team do over and over?'),
  ).toHaveJSProperty('tagName', 'TEXTAREA');
});

test('the video stays on a phone on its side, with its button clear of the words', async ({
  page,
}) => {
  await page.setViewportSize({ width: 812, height: 375 });
  await opened(page, '/work-with-me');
  const video = page.locator('article figure');
  expect((await video.boundingBox())!.width).toBeGreaterThanOrEqual(300);
  // Along the video's bottom its words end 82.3% of the way across (measured
  // in its source, every 0.1s): the button stays right of them.
  for (const [width, height] of [
    [812, 375],
    [320, 640],
    [375, 812],
    [1280, 800],
  ] as const) {
    await page.setViewportSize({ width, height });
    const frame = (await video.boundingBox())!;
    const button = (await video.getByRole('button').boundingBox())!;
    expect(
      (button.x - frame.x) / frame.width,
      `button's left at ${width}px`,
    ).toBeGreaterThan(0.825);
    expect(button.y + button.height).toBeLessThanOrEqual(
      frame.y + frame.height,
    );
  }
});
