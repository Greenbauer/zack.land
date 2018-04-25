// ContactPage

import PropTypes from 'prop-types'
import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'

import Article from 'components/Article'
import Column from 'components/Column'
import Container from 'components/Container'
import H2 from 'components/H2'
import Row from 'components/Row'
import Section from 'components/Section'

import { changePageHeader } from 'containers/App/actions'

import ContactForm from './contactForm'

export class ContactPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      title: 'Contact Me'
    }
  }

  componentWillMount() {
    this.props.onLoadState(this.state.title)
  }

  render() {
    return (
      <Container>
        <Helmet>
          <title>Contact Me</title>
          <meta name="description" content="Contact Me" />
        </Helmet>
        <Row className="float-right">
          <Section className="form">
            <Article className="form">
              <Column className="sm-12 col-centered">
                <ContactForm />
              </Column>
            </Article>
          </Section>
        </Row>
      </Container>
    )
  }
}

ContactPage.PropTypes = {
  onLoadState: PropTypes.func,
}

export function mapDispatchToProps(dispatch) {
  return {
    onLoadState: (title) => {
      dispatch(changePageHeader(title))
    },
  }
}

const mapStateToProps = createStructuredSelector({})

const withConnect = connect(mapStateToProps, mapDispatchToProps)

export default compose(
  withConnect,
)(ContactPage)
