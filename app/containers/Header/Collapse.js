import PropTypes from 'prop-types'
import React from 'react'

function Collapse({ isActive, ...props }) {
  return (
    <div className={`nav-collapse ${isActive && 'active'}`}>
      <div {...props} />
    </div>
  )
}

Collapse.propTypes = {
  isActive: PropTypes.bool.isRequired,
}

export default Collapse
