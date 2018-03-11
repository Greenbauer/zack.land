// Header

import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM, {render} from 'react-dom'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap'

import Container from 'components/Container'
import Row from 'components/Row'
import Column from 'components/Column'

import { updateHeaderTitle } from 'containers/App/selectors'

import Collapse from './Collapse'
import Hamburger from './Hamburger'
import NavBar from './NavBar'
import NavList from './NavList'
import NavListBackground from './NavListBackground'
import NavListItem from './NavListItem'
import Title from './Title'

export class Header extends React.Component {
  constructor(props) {
    super(props)
    this.handleScroll = this.handleScroll.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.state = {
      isActive: false,
      isScrolling: false
    }
  }

  componentDidMount() {
    document.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll)
  }

  // detect srolling
  handleScroll(evt) {
    if (window.scrollY > 10) {
      this.setState({
        isScrolling: true
      })

    } else {
      this.setState({
        isScrolling: false
      })
    }
  }

  // toggle collapsing mobile menu
  handleClick() {
    this.setState({isActive: !this.state.isActive})
  }

  render() {
    return (
      <NavBar isScrolling={this.state.isScrolling}>
        <Container>

          <Collapse
            isActive={this.state.isActive}
            isScrolling={this.state.isScrolling}
          >
            <NavList id="nav-list">
              <NavListItem onClick={this.handleClick}>

                <IndexLinkContainer className="nav-link" to="/">
                  <a key={1}>
                    Home
                  </a>
                </IndexLinkContainer>
              </NavListItem>

              <NavListItem onClick={this.handleClick}>
                <LinkContainer className="nav-link" to="/portfolio">
                  <a key={2}>
                    Portfolio
                  </a>
                </LinkContainer>
              </NavListItem>

              <NavListItem onClick={this.handleClick}>
                <LinkContainer className="nav-link" to="/contact">
                  <a key={3}>
                    Contact
                  </a>
                </LinkContainer>
              </NavListItem>

              <NavListBackground />

            </NavList>
          </Collapse>

          <Hamburger
            onClick={this.handleClick}
            isActive={this.state.isActive}
          />
          <Title>
            {this.props.title}
          </Title>

        </Container>
      </NavBar>
    )
  }
}

Header.PropTypes = {
  title: PropTypes.string,
}

export function mapDispatchToProps(dispatch) {
  return {
  }
}

const mapStateToProps = createStructuredSelector({
  title: updateHeaderTitle(),
})

const withConnect = connect(mapStateToProps, mapDispatchToProps, null, {pure: true})

export default compose(
  withConnect,
)(Header)
