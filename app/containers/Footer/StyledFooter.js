// Footer styles

import styled from 'styled-components'

const StyledFooter = styled.div`
  padding-bottom: 40px;
  width: 100%;
  top: 100%;

  @media (max-width: 768px) {
    .text-left, .text-right {
      text-align: center !important;
    }

    #icons {
      order: 1;
    }

    #text {
      order: 0;
      padding-bottom: 40px;
    }
  }
`

export default StyledFooter
