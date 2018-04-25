// App

import React from 'react'
import { Helmet } from 'react-helmet'
import { Switch, Route } from 'react-router-dom'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import styled from 'styled-components'

import ContactPage from 'containers/ContactPage/Loadable'
import HomePage from 'containers/HomePage/Loadable'
import PortfolioPage from 'containers/PortfolioPage/Loadable'

import Background from 'containers/Background'
import Container from 'components/Container'
import Footer from 'containers/Footer'
import Header from 'containers/Header'

import Wrapper from './Wrapper'

const Body = styled.div`
  display: flex;
  flex-grow: 1;
  width: 100%;
  padding-top: 140px;
  position: relative;
  //min-height: ${props => props.height + 140}px;
`

// const TTT = styled.div`
//   //position: absolute;
//   display: flex;
//   width: 100%;
//   //height: 100%;
//   top: 0;
//   //bottom: 0;
//   //margin: auto;
//
//   #nnn {
//     position: relative;
//     display: flex;
//     width: 100%;
//   }
// `
// const TTTIN = styled.div`
//   position: relative;
//   //display: flex;
//   width: 100%;
// `

class App extends React.Component {
  // constructor(props) {
  //   super(props)
  //   this.getHeight = this.getHeight.bind(this)
  //   this.state = {
  //     height: 1
  //   }
  // }
  //
  // componentDidMount() {
  //   this.getHeight()
  //   window.addEventListener("resize", this.getHeight)
  //   window.addEventListener('readystatechange', this.getHeight)
  // }
  //
  // componentWillUnmount() {
  //   window.removeEventListener("resize", this.getHeight)
  // }
  //
  // componentDidUpdate() {
  //   this.getHeight()
  //
  // }
  //
  // getHeight() {
  //   //const height = document.getElementById('ttt').getElementsByTagName('*').clientHeight
  //   // const height = document.getElementById('nnn').clientHeight
  //   // console.log('hhh', height, this.elem)
  //   // if (this.state.height !== height) {
  //   //   this.setState({height: height})
  //   // }
  //
  //
  //   // const height = this.elem.children[0].children[0].clientHeight
  //   // console.log('ddd', this.elem.children[0].children[0].clientHeight)
  //   // if (this.state.height !== height) {
  //   //   this.setState({ height: height })
  //   // }
  // }

  render() {
    return (
    <Wrapper>
      <Helmet
        titleTemplate="%s - Zack Greenbauer"
        defaultTitle="Zack Greenbauer"
      >
        <meta name="description" content="Zack Greenbauer's Portfolio and Sandbox" />
      </Helmet>
      <Header />
      <Body>
        <Switch location={this.props.history.location}>
          <Route exact path="/" component={HomePage} />
          <Route path="/portfolio" component={PortfolioPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="" component={HomePage} />
        </Switch>
      </Body>
      <Footer />
      <Background />
    </Wrapper>
    )
  /*  return (
      <Wrapper>
        <Helmet
          titleTemplate="%s - Zack Greenbauer"
          defaultTitle="Zack Greenbauer"
        >
          <meta name="description" content="Zack Greenbauer's Portfolio and Sandbox" />
        </Helmet>
        <Header />
        <Body height={this.state.height}>
          <TransitionGroup component="main" className="transition-group">
            <CSSTransition
              key={this.props.history.location.key}
              timeout={{enter: 1800, exit: 0}}
              classNames="fade"
              appear
            >
              <TTT id="ttt" >
                <Switch location={this.props.history.location}>
                  <Route exact path="/" component={HomePage} />
                  <Route path="/portfolio" component={PortfolioPage} />
                  <Route path="/contact" component={ContactPage} />
                  <Route path="" component={HomePage} />
                </Switch>
              </TTT>
            </CSSTransition>
          </TransitionGroup>
        </Body>
        <Footer />
        <Background />
      </Wrapper>
    )*/
  }
}

export default App
