// The home page name's words, which TitleName draws as 3D letters over the
// spot each takes on the page. Title registers them: each word's element (for
// its left edge and font size) and a zero-size marker at its start sitting on
// the text's baseline.

export type TitleWord = {
  text: string;
  word: HTMLElement;
  baseline: HTMLElement;
};

export const titleWords = new Map<number, TitleWord>();

// Whether `shown` is still exactly the words registered, in order. The count
// alone is not enough: Home's name, Web Apps and Contact Me are all two
// words, and a page change swaps one pair for another in one go.
export const isCurrent = (shown: TitleWord[]) =>
  shown.length === titleWords.size &&
  [...titleWords.values()].every((word, k) => word === shown[k]);
