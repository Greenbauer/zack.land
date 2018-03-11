// Bootstrap Column

import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

const StyledColumn = styled.div`
  position: relative;
`

const Column = ({className="", ...props}) => (
  <StyledColumn className={`col-${className}`} {...props} />
)

Column.propTypes = {
  className: PropTypes.string,
}

export default Column
