# zack.land — brand & social kit

Social/sharing assets for Zack Greenbauer's portfolio. Built from the site's own
design tokens (`tailwind.config.js` + `styles/globals.css`) so they match the live site.

## Brand tokens

| Token  | Value                  |
|--------|------------------------|
| black  | `#111111` (bg)         |
| white  | `#dddddd`              |
| yellow | `#ffd265`              |
| pink   | `#ff31af`              |
| cyan   | `#3de1ff`              |
| blue   | `#003380`              |

- **Headline font:** Kanit (600/500), UPPERCASE, wide tracking.
- **Subhead font:** Roboto (100 thin), UPPERCASE, wide tracking.
- **Signature gradient** (the H1 mark): `#111 linear-gradient(80deg, yellow 4%, pink 8%, cyan 20%, blue 85%)` — colors at **75% alpha over #111**, clipped to text. Identical to `globals.css` `h1`. Warm flash (yellow/pink) at the far left, fading through cyan to navy.
- **Domain is always written `www.zack.land`.**
- **No vibrant/rainbow elements** — the muted gradient on near-black is the whole look.
- **Icon = the site's matcap 3D head** (`public/background/geometry/myHead.obj` + `public/background/images/mainMatcap.jpg`), rendered with the exact custom matcap shader from `components/Background/useMatcap.ts`. NOT a letter/monogram.

## Assets

| File | Size | Use |
|------|------|-----|
| `icon-1024.png` | 1024² | Master profile icon / avatar (all platforms) |
| `icon-1024.png` | 1024² | Master profile icon / avatar — the matcap 3D head |
| `icon-512.png` / `icon-256.png` | 512² / 256² | Smaller avatar sizes |
| `apple-touch-icon.png` | 180² | iOS home-screen icon |

> **Favicon:** unchanged — the existing `public/favicon.ico` stays as the browser favicon. This kit does **not** ship a replacement favicon.
| `og-image.png` | 1200×630 | Link preview for iMessage/text, Slack, Discord, Facebook, X/Twitter, LinkedIn shares |
| `linkedin-banner-1584x396.png` | 1584×396 | LinkedIn personal profile cover (lower-left kept clear for the avatar) |
| `instagram-1080x1080.png` | 1080×1080 | Instagram post / square social |
| `wordmark.png` | 1700×440, transparent | `WWW.ZACK.LAND` logotype (uppercase, light-weight, gradient reversed: blue→cyan→pink→gold) for dark backgrounds |

## Regenerating

Text assets: `/tmp/brandkit/build.py` (HTML + embedded Kanit/Roboto woff2).
Icon (matcap head): `/tmp/brandkit/head.html` — Three.js r128 loading the repo's `myHead.obj` +
`mainMatcap.jpg` with the site's matcap shader. Both rendered with headless Chrome at 2×
(`--allow-file-access-from-files --use-angle=swiftshader` for the WebGL head) and downscaled with `sips`.

## Optional: wire the OG image into the site

In `app/layout.tsx` (or per-page `metadata`), add:

```ts
export const metadata = {
  metadataBase: new URL('https://zack.land'),
  openGraph: { images: ['/brand/og-image.png'] },
  twitter: { card: 'summary_large_image', images: ['/brand/og-image.png'] },
  icons: { icon: '/favicon.ico', apple: '/brand/apple-touch-icon.png' },
};
```
