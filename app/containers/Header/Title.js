// Title for Header

import styled from 'styled-components'

const Title = styled.div`
  width: 100%;
  color: #cccccc;
  text-transform: uppercase;
  font-size: 1.5rem;
  letter-spacing: 0.03em;
  padding: 0;
  position: relative;
  display: inline-block;
  text-align: right;
  float: right;

  @media (max-width: 992px) {
    font-size: 2vw;
    line-height: 3rem;
  }
  @media (max-width: 767px) {
    font-size: 4vw;
    width: 80%;
  }
  @media (max-width: 540px) {
    font-size: 22px;
  }
  `
export default Title
