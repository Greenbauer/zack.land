export type MediaSource = {
  key: string;
  alt: string;
  type: string;
};

export type Content = {
  name: string;
  siteUrl?: string;
  galleryUrl?: string;
  repositoryUrl?: string;
  mediaSources?: MediaSource[];
  description?: JSX.Element;
  technology?: string;
};
