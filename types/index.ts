import { JSX } from 'react';

export type MediaSource = {
  key: string;
  alt: string;
  type: string;
  // An image's size in pixels, which picks its crop (components/collageLayout.ts).
  width?: number;
  height?: number;
  // An image laid out as its post's largest tile, in its own shape, when the
  // post has no video (components/PostCollage.tsx).
  main?: true;
};

export type Content = {
  name: string;
  siteUrl?: string;
  repositoryUrl?: string;
  mediaSources?: MediaSource[];
  description?: JSX.Element;
  technology?: string;
  // How a site was built: written by hand, or with an AI writing the code.
  coded?: 'hand' | 'vibe';
};
