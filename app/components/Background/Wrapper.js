// Wrapper for Background

import styled from 'styled-components'

const Wrapper = styled.div`
  position: fixed;
  display: flex;
  min-height: 100%;
  min-height: 100vh;
  min-width: 100%;
  min-width: 100vw;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -999;
  top: 0;
  left: 0;
`

export default Wrapper
