import React from 'react'
import styled from 'styled-components'

import { border, lightestColor } from 'global-styles'

const Wrapper = styled.div`
  position: fixed;
  bottom: 50%;
  margin: auto;
  left: 0;
  right: 0;
`

const StyledSpinner = styled.div`
  &:after {
    border-radius: 50%;
    width: 20em;
    height: 20em;
  }

  border-radius: 50%;
  width: 20em;
  height: 20em;
  margin: 60px auto;
  font-size: 10px;
  position: relative;
  text-indent: -9999em;
  border-top: ${border};
  border-right: ${border};
  border-bottom: ${border};
  border-left: 1px solid ${lightestColor};
  transform: translateZ(0);
  animation: load8 1.1s infinite linear;

  @-webkit-keyframes load8 {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes load8 {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

function Spinner() {
  return (
    <Wrapper>
      <StyledSpinner />
    </Wrapper>
  )
}

export default Spinner
