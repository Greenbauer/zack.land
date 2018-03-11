// H1

import styled from 'styled-components'

const gradient = `
  80deg,
  rgba(255, 210, 101, 0.7) 4%,
  rgba(255, 49, 175, 0.7) 8%,
  rgba(61, 225, 255, 0.7) 20%,
  rgba(0, 51, 128, 0.7) 85%
`

const H1 = styled.h1`
  font-size: 4.5em;
  margin-bottom: 0.4em;
  text-transform: Uppercase;
  letter-spacing: 0.05em;

  background: #090909 linear-gradient(${gradient});
  background-size: auto auto;
  background-size: 100% 100%;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;

  @media (max-width: 1350px) {
    font-size: 3.2rem;
  }

  @media (max-width: 991px) {
    font-size: 2.5rem;
  }

  @media (max-width: 767px) {
    font-size: 9vw;
  }

  @media (max-width: 540px) {
    font-size: 30px;
  }
`

export default H1
