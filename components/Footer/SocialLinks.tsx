import Link from 'next/link';
import { cloneElement, ReactElement } from 'react';
import { IconBaseProps } from 'react-icons';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

type SocialRoute = { Icon: ReactElement<IconBaseProps>; url: string };

const socialRoutes: SocialRoute[] = [
  {
    Icon: <FaGithub />,
    url: 'https://github.com/Greenbauer',
  },
  {
    Icon: <FaXTwitter />,
    url: 'https://x.com/greenbauer',
  },
  {
    Icon: <FaLinkedin />,
    url: 'https://www.linkedin.com/in/greenbauer',
  },
];

export default function SocialLinks() {
  return (
    <div className="flex flex-nowrap gap-6">
      {socialRoutes.map(({ Icon, url }) => (
        <Link
          key={url}
          className="text-[color:var(--sky-muted)] hover:text-[color:var(--sky-accent)] active:text-[color:var(--sky-text)]"
          target="_blank"
          href={url}
          rel="noreferrer"
        >
          {cloneElement(Icon, { size: 34 })}
        </Link>
      ))}
    </div>
  );
}
