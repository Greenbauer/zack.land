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
