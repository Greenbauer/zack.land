# zack.land — brand & social kit

Social and sharing assets for Zack Greenbauer's portfolio, taken from the live
site's own dawn look: the 3D head and its sky (`components/Background/`), the
palette in `theme/head.json`, and the site's fonts.

## Brand tokens

The dawn palette (`theme/head.json`):

| Token  | Value     |
|--------|-----------|
| light  | `#ede4e3` |
| peach  | `#d3aba0` |
| rose   | `#a57374` |
| purple | `#594d69` |
| blue   | `#1c265b` |
| indigo | `#0b1953` |
| navy   | `#040227` |
| dark   | `#010018` |

- **Name font:** Kanit, uppercase, as the home page's title.
- **Subtitle and text font:** Roboto (light), as the site's subtitle and footer.
- **The name** ("Zack Greenbauer's") shades left to right through part of the
  palette, chosen against each image's sky: dark tones (navy to rose) on a light
  sky, light tones (light to rose) on a dark one. No shadows.
- **Domain is always written `www.zack.land`**, lowercase and widely spaced, as
  the site sets it.
- **The head** faces right of the camera with a neutral face, and a strip of the
  site's glass lies over the shoulders only, never the face.

## Assets

| File | Size | Use |
|------|------|-----|
| `icon-1024.png` / `icon-512.png` / `icon-256.png` | 1024² / 512² / 256² | Profile icon / avatar: both eyes and the nose, close up |
| `apple-touch-icon.png` | 180² | iOS home-screen icon (same close-up) |
| `og-image.png` | 1200×630 | Link preview for iMessage, Slack, Discord, Facebook, X and LinkedIn shares |
| `linkedin-banner-1584x396.png` | 1584×396 | LinkedIn profile cover |
| `x-header-1500x500.png` | 1500×500 | X profile header |
| `instagram-1080x1080.png` | 1080×1080 | Square post (Instagram and others) |
| `wordmark.png` | 1700×440, transparent | `www.zack.land` in Roboto light, light to rose, for dark backgrounds |

> **Favicon:** `public/favicon.ico` holds 16, 32 and 48 pixel PNG images of one
> eye, closer than the app icons, so the face still reads at tab size.

Each social image has its own part of the dawn sky: lilac to blush (link
preview), a pink to purple sweep (LinkedIn), warm cream (X) and mauve (square).

## Regenerating

The images are screenshots of the site itself, rendered in headless Chrome at
2× and cropped to size: the pointer held to the head's right at eye height (so
it turns right without squinting or raising its brows), the sky held at a fixed
turn per image (`scene.backgroundRotation` and `scene.environmentRotation`, as
`components/Background/Sky.tsx` sets them), the title, subtitle, tagline and
domain placed over it, and a glass card (any `section`) laid over the shoulders.
The render scripts are not kept in the repository.

## Link previews (wired in `app/layout.tsx`)

The OG/Twitter metadata and icons are in the root layout's `metadata` export,
so link-preview crawlers (iMessage, Slack, X, Facebook, LinkedIn) serve
`og-image.png`:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://www.zack.land'),
  openGraph: { /* title, description, url, siteName, type */
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: ['/brand/og-image.png'] },
  icons: { icon: '/favicon.ico', apple: '/brand/apple-touch-icon.png' },
};
```
