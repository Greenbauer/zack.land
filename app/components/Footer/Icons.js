import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const setIcon = icon => (
  <a key={icon.name} target="_blank" href={icon.url}>
    <FontAwesomeIcon icon={['fab', icon.name]} size="2x" />
  </a>
)

function Icons(props) {
  const icons = [
    {
      name: 'behance',
      url: 'https://www.behance.net/greenbauer',
    },
    {
      name: 'github',
      url: 'https://github.com/Greenbauer',
    },
    {
      name: 'instagram',
      url: 'https://www.instagram.com/zgreenbauer',
    },
    {
      name: 'linkedin',
      url: 'https://www.linkedin.com/in/greenbauer',
    },
  ]

  return <div {...props}>{icons.map(icon => setIcon(icon))}</div>
}

export default Icons
