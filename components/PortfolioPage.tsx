import MediaMelt from '@/components/MediaMelt';
import ScrollArrows from '@/components/PageScroller/ScrollArrows';
import SnapPager from '@/components/PageScroller/SnapPager';
import Post from '@/components/Post';
import { Content } from '@/types';

// A portfolio page: its posts one under another, turned one at a time
// (SnapPager), with the arrows beside them.
export default function PortfolioPage({ contents }: { contents: Content[] }) {
  return (
    <div className="flex w-full">
      <ScrollArrows />
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--post-gap)]">
        <SnapPager />
        <MediaMelt />
        {contents.map((content, k) => (
          <Post key={content.name} content={content} isFirst={k === 0} />
        ))}
      </div>
    </div>
  );
}
