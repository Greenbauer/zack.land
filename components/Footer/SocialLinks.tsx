import Link from 'next/link';
import { cloneElement, ReactElement } from 'react';
import { FaBehance, FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa';

type SocialRoute = { Icon: ReactElement; url: string };

const socialRoutes: SocialRoute[] = [
  {
    Icon: <FaBehance />,
    url: 'https://www.behance.net/greenbauer',
  },
  {
    Icon: <FaGithub />,
    url: 'https://github.com/Greenbauer',
  },
  {
    Icon: <FaInstagram />,
    url: 'https://www.instagram.com/zgreenbauer',
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
          className="text-gray-lightest hover:text-yellow active:text-gray"
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
