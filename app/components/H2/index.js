// H2

import styled from 'styled-components'

const H2 = styled.h2`
  font-family: 'Roboto', sans-serif;
  font-weight: 100;
  font-size: 2.5em;
  margin-bottom: 20px;
  text-transform: Uppercase;
  letter-spacing: 0.03em;
  color: #cccccc;

  @media (max-width: 991px) {
    font-size: 2.2rem;
  }

  @media (max-width: 767px) {
    font-size: 1.5rem;
  }

  @media (max-width: 540px) {
    font-size: 18px;
  }
`

export default H2
