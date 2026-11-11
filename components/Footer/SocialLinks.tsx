import Link from 'next/link';
import { cloneElement, ReactElement } from 'react';
import { IconBaseProps } from 'react-icons';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

import { SOCIAL_LINKS } from '@/utils/site';

// Each profile's icon (the profiles themselves: utils/site.ts).
const icons: Record<
  (typeof SOCIAL_LINKS)[number]['name'],
  ReactElement<IconBaseProps>
> = {
  GitHub: <FaGithub />,
  X: <FaXTwitter />,
  LinkedIn: <FaLinkedin />,
};

export default function SocialLinks() {
  return (
    <div className="flex flex-nowrap gap-6">
      {SOCIAL_LINKS.map(({ name, url }) => (
        <Link
          key={url}
          className="text-[color:var(--sky-text)] hover:text-[color:var(--sky-accent)] active:text-[color:var(--sky-text)]"
          target="_blank"
          href={url}
          rel="noreferrer"
        >
          {cloneElement(icons[name], { size: 34 })}
        </Link>
      ))}
    </div>
  );
}
