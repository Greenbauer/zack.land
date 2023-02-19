export type MediaSrc = {
  key: string;
  alt: string;
  type: string;
};

export type Content = {
  name: string;
  siteUrl?: string;
  galleryUrl?: string;
  repoUrl?: string;
  src?: MediaSrc[];
  desc?: JSX.Element;
  tech?: string;
};
