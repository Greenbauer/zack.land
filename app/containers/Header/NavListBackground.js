// NavListBackground for Header

import PropTypes from 'prop-types'
import styled from 'styled-components'
import React from 'react'

const StyledNavListBackground = styled.li`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;

  background: #111111 linear-gradient(
    60deg,
    rgba(255, 210, 101, 0.7) 5%,
    rgba(255, 49, 175, 0.7) 15%,
    rgba(61, 225, 255, 0.7) 30%,
    rgba(0, 51, 128, 0.7) 40%,
    #111111 50%,
    rgba(0, 51, 128, 0.7) 60%,
    rgba(61, 225, 255, 0.7) 70%,
    rgba(255, 49, 175, 0.7) 85%,
    rgba(255, 210, 101, 0.7) 95%
  );
  background-size: auto auto;
  background-size: 300% 100%;
  background-position-x: ${props => props.mouse.x}%;
  transition-delay: 0s, 0.2s, 0s;
  transition: transform 0.8s, color 0.3s, background-position-x 0.7s;
`

class NavListBackground extends React.PureComponent {
  constructor(props) {
    super(props)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.state = {
      isMouse: true,
      mouse: {x: 100, y: 100},
    }
  }

  componentDidMount() {
    document.getElementById('nav-list').addEventListener('touchstart', evt => {this.handleTouchStart()})
    document.getElementById('nav-list').addEventListener('mousemove', evt => {this.handleMouseMove(evt)})
  }

  componentWillUnmount() {
    document.getElementById('nav-list').removeEventListener('touchstart', evt => {this.handleTouchStart()})
    document.getElementById('nav-list').removeEventListener('mousemove', evt => {this.handleMouseMove(evt)})
  }

  // need to detect touch device because ios will override a click with a mousemove
  handleTouchStart() {
    this.setState({isMouse: false})
  }

  handleMouseMove(evt) {
    if (this.state.isMouse) {
      this.setState({
        mouse: {
        x: 0.08 * (evt.clientX + this.state.mouse.x) + 70,
        y: evt.clientY
        }
      })

    } else {
      return false
    }
  }

  render() {

    const {className="",  ...props} = this.props

    return (
    <StyledNavListBackground
      mouse={this.state.mouse}
      className={`${className}`}
      {...props}
    />
    )
  }
}

NavListBackground.PropTypes = {
  className: PropTypes.string,
  mouse: PropTypes.object.isRequired
}

export default NavListBackground
