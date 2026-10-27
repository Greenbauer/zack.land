// Keeps text that sits over the 3D background readable as the sky behind it
// turns. Elements register here; BackdropSampler reads back the rendered
// pixels behind each one a few times a second and reports their luminance, and
// the element picks a text colour that meets a contrast ratio against it.

type OnLuminance = (..._samples: [number[]]) => void;

type Watcher = { element: HTMLElement; onLuminance: OnLuminance };

const watchers = new Set<Watcher>();

// Calls onLuminance with WCAG relative luminances (0 to 1) sampled across the
// background behind `element`, whenever it is sampled. Returns an unwatch.
export function watchBackdrop(
  element: HTMLElement,
  onLuminance: OnLuminance,
): () => void {
  const watcher = { element, onLuminance };
  watchers.add(watcher);
  return () => {
    watchers.delete(watcher);
  };
}

export const backdropWatchers = (): ReadonlySet<Watcher> => watchers;

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (l: number) =>
  Math.round(
    255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055),
  );

// WCAG 2 relative luminance of an sRGB colour given as 0 to 255 channels.
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// WCAG 2 contrast ratio between two luminances.
export const contrastRatio = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// The lightest colour between `light` and `dark` (sRGB 0 to 255 channels)
// that reaches `ratio` against a background of luminance `background`: `light`
// itself whenever it is enough, and as little darker as will do otherwise.
// Over the narrow middle band where neither reaches it, whichever comes
// closer.
export function readableText(
  background: number,
  ratio: number,
  light: [number, number, number],
  dark: [number, number, number],
): [number, number, number] {
  const [lightL, darkL] = [light, dark].map((c) => relativeLuminance(...c)) as [
    number,
    number,
  ];
  if (contrastRatio(lightL, background) >= ratio) return light;
  // The brightest text luminance that still reaches the ratio, as dark text.
  const target = (background + 0.05) / ratio - 0.05;
  if (target <= darkL)
    return contrastRatio(lightL, background) > contrastRatio(darkL, background)
      ? light
      : dark;
  // Mix light toward dark (in linear light, where luminance mixes linearly)
  // until the luminance comes down to the target.
  const t = (lightL - target) / (lightL - darkL);
  return light.map((c, k) =>
    toSrgb(toLinear(c) * (1 - t) + toLinear(dark[k]!) * t),
  ) as [number, number, number];
}
