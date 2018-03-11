// App

import React from 'react'
import { Helmet } from 'react-helmet'
import { Switch, Route } from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
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
  padding-top: 100px;
`

export const App = props => {

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
        <Switch>
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
}

export default App
