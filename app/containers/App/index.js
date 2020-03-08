import React from 'react'
import styled from 'styled-components'
import { Helmet } from 'react-helmet'
import { Switch, Route } from 'react-router-dom'

import Background from 'components/Background'
import Footer from 'components/Footer'

import ContactPage from 'containers/ContactPage/Loadable'
import HomePage from 'containers/HomePage/Loadable'
import PortfolioPage from 'containers/PortfolioPage/Loadable'
import Header from 'containers/Header'

import 'bootstrap/dist/css/bootstrap.min.css'
import GlobalStyle from '../../global-styles'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  position: relative;
`

function App() {
  return (
    <Wrapper>
      <Helmet
        titleTemplate="%s - Zack Greenbauer"
        defaultTitle="Zack Greenbauer"
      >
        <meta
          name="description"
          content="Zack Greenbauer's Portfolio and Sandbox"
        />
      </Helmet>
      <Header />
      <div className="app-body">
        <Switch>
          <Route exact path="/" component={HomePage} />
          <Route path="/portfolio" component={PortfolioPage} />
          <Route path="/contact" component={ContactPage} />
        </Switch>
      </div>
      <Footer />
      <Background />
      <GlobalStyle />
    </Wrapper>
  )
}

export default App
