// How a post's images share its gallery, which has a fixed size so the post
// fits on one screen: one fills it, two sit side by side, three put the first
// down the left with two stacked beside it, and four make a two by two grid.
export function galleryLayout(count: number) {
  const grid =
    count <= 1
      ? 'grid-cols-1 grid-rows-1'
      : count === 2
        ? 'grid-cols-2 grid-rows-1'
        : 'grid-cols-2 grid-rows-2';
  return {
    grid,
    cell: (index: number) => (count === 3 && index === 0 ? 'row-span-2' : ''),
  };
}
