import { cloneElement } from 'react'
import {
  FaBehance,
  FaGithub,
  FaInstagram,
  FaLinkedin,
} from 'react-icons/fa';

type SocialLinkType = { Icon: JSX.Element, url: string }

const socialLinks: SocialLinkType[] = [
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
]

export default function SocialLinks() {
  return (
    <div className="align-text-bottom">
      {socialLinks.map(({ Icon, url }: SocialLinkType) => (
        <a key={url} target="_blank" href={url} rel="noreferrer">
          {cloneElement(Icon, { size: 34 })}
        </a>
      ))}
    </div>
  )
}
