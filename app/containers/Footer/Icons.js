// Icons for Footer

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import Column from 'components/Column'
import Behance from 'components/Icons/Behance'
import GitHub from 'components/Icons/GitHub'
import Instagram from 'components/Icons/Instagram'
import Linkedin from 'components/Icons/Linkedin'
import Row from 'components/Row'

const StyledIcons = styled.div`
  position: absolute;
  display: inline-block;
  bottom: 6px;

  @media (max-width: 768px) {
    position: relative;
  }

  a {
    padding: 0 20px;
  }

  a:hover path {
    fill: rgba(255, 210, 101, 0.9);
  }
  a:active path {
    fill: #222222;
  }
`

const Icons = ({className="", ...props}) => (
  <StyledIcons
    className={`${className}`}
    {...props}
  >
  <Row>

    <a
      target="_blank"
      href="https://www.behance.net/greenbauer"
    >
      <Behance
        strokeColor="none"
        fillColor="#aaaaaa"
        size={28}
      />
    </a>
    <a
      target="_blank"
      href="https://github.com/Greenbauer"
    >
      <GitHub
        strokeColor="none"
        fillColor="#aaaaaa"
        size={24}
      />
    </a>
    <a
      target="_blank"
      href="https://www.instagram.com/zgreenbauer"
    >
      <Instagram
        strokeColor="none"
        fillColor="#aaaaaa"
        size={25}
      />
    </a>
    <a
      target="_blank"
      href="https://www.linkedin.com/in/greenbauer"
    >
      <Linkedin
        strokeColor="none"
        fillColor="#aaaaaa"
        size={24}
      />
    </a>

    </Row>
  </StyledIcons>
)

Icons.PropTypes = {
  className: PropTypes.string,
}

export default Icons
