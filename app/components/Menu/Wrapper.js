// Wrapper for Menu

import styled from 'styled-components'

const Wrapper = styled.div`

  /* work around, because 'position: fixed;' with bootsrap 4 ignores parent styles */
  position: fixed;
  width: 1440px; /* must be same as Container */

  @media (max-width: 1850px) {
    width: 1140px;
  }
  @media (max-width: 1350px) {
    width: 900px;
  }
  @media (max-width: 991px) {
    width: 760px;
  }
  @media (max-width: 767px) {
    width: auto;
    position: relative;
    display: none;

    &.needed {
      display: block;
    }
  }
`

export default Wrapper
