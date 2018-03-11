// Footer

import PropTypes from 'prop-types'
import React from 'react'

import A from 'components/A'
import Column from 'components/Column'
import Container from 'components/Container'
import H6 from 'components/H6'
import Row from 'components/Row'

import StyledFooter, { Wrapper } from './StyledFooter'
import Icons from './Icons'

const Footer = (props) => {
  return (
    <StyledFooter className="footer">
      <Container>
        <Row>

          <Column id="icons" className="md-5 text-left">
            <Icons />
          </Column>

          <Column id="text" className="md-7 text-right">
            <H6>
             I can make almost anything.<br />
             <A
              className="underline"
              href="/contact"
            >
            Contact me
            </A>
             if you need help developing an idea.
           </H6>
          </Column>
        </Row>
      </Container>
    </StyledFooter>
  )
}

export default Footer
