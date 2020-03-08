import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import Scrollspy from 'react-scrollspy'
import { Link } from 'react-router-dom'

import Arrow from './Arrow'

import Wrapper from './Wrapper'

// for scrollspy reference
const scrollRef = item => (
  <a href={`#${item.name.replace(/ /g, '-')}`}>{item.name}</a>
)

// for page routing
const link = item => (
  <Link href={item.name} to={item.route}>
    {item.name}
  </Link>
)

function Menu(props) {
  let menuItems = []
  let scrollItems = []

  if (props.items) {
    // menu items
    menuItems = props.items.map(item => (
      <li className="menu-item" key={`${item.name.replace(/ /g, '-')}`}>
        <h3>{item.route ? link(item) : scrollRef(item)}</h3>
      </li>
    ))

    // scrollspy item map
    scrollItems = menuItems.map(item => item.key)
  }

  const [width, setWidth] = useState(0)

  const ref = useRef(null)

  const handleWidth = () => {
    if (ref.current && ref.current.parentNode)
      setWidth(ref.current.parentNode.clientWidth)
  }

  useEffect(() => {
    handleWidth()

    window.addEventListener('resize', handleWidth)
    return () => window.removeEventListener('resize', handleWidth)
  }, [])

  return (
    <Wrapper ref={ref} menuWidth={width} {...props}>
      <div className="menu">
        <Scrollspy
          items={[...scrollItems]}
          currentClassName="active"
          offset={500}
        >
          {menuItems}
        </Scrollspy>
        {props.useArrow && <Arrow />}
      </div>
    </Wrapper>
  )
}

Menu.propTypes = {
  useArrow: PropTypes.bool,
  items: PropTypes.array,
}

export default Menu
