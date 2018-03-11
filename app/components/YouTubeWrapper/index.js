// YouTubeWrapper

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledYouTubeWrapper = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
	padding-top: 25px;
	height: 0;
`

const YouTubeWrapper = ({className="", ...props}) => (
  <StyledYouTubeWrapper className={`youtube ${className}`} {...props} />
)

YouTubeWrapper.propTypes = {
  className: PropTypes.string,
}

export default YouTubeWrapper
