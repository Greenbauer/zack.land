// Contactpage selectors

import { createSelector } from 'reselect'

const selectContact = (state) => state.get('contact')

const makeEmailName = () => createSelector(
  selectContact,
  (contactState) => contactState.get('name')
)

const makeEmailEmail = () => createSelector(
  selectContact,
  (contactState) => contactState.get('email')
)

const makeEmailSubject = () => createSelector(
  selectContact,
  (contactState) => contactState.get('subject')
)

const makeEmailMessage = () => createSelector(
  selectContact,
  (contactState) => contactState.get('message')
)

const makeEmailLoading = () => createSelector(
  selectContact,
  (contactState) => contactState.get('loading')
)

const makeEmailError = () => createSelector(
  selectContact,
  (contactState) => contactState.get('error')
)

const makeEmailSuccess = () => createSelector(
  selectContact,
  (contactState) => contactState.get('success')
)

export {
  selectContact,
  makeEmailName,
  makeEmailEmail,
  makeEmailSubject,
  makeEmailMessage,
  makeEmailLoading,
  makeEmailError,
  makeEmailSuccess,
}
