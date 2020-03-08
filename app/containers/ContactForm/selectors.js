import { createSelector } from 'reselect'
import { initialState } from './reducer'

const selectContact = state => state.contact || initialState

export const emailSending = () =>
  createSelector(
    selectContact,
    contactState => contactState.sending,
  )

export const emailSendingError = () =>
  createSelector(
    selectContact,
    contactState => contactState.sendingError,
  )

export const emailSendingSuccess = () =>
  createSelector(
    selectContact,
    contactState => contactState.sendingSuccess,
  )
