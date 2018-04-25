// Article

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledArticle = styled.div`
  padding: 40px 40px 35px 40px;
  width: 100%;

  li {
    padding: 15px 0 5px 0;
  }
`

const Article = ({className="", ...props}) => (
  <StyledArticle className={`article ${className}`} {...props} />
)

Article.propTypes = {
  className: PropTypes.string,
}

export default Article
