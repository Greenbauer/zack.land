export type MediaSrc = {
  key: string
  alt: string
  type: string
}

export type Content = {
  name: string
  url?: string
  src?: MediaSrc[]
  desc?: JSX.Element
  tech?: string
  repo?: string
}