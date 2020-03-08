/*
 * Contact Reducer
 */

import produce from 'immer'
import { POST_EMAIL_SUCCESS, POST_EMAIL_ERROR, POST_EMAIL } from './constants'

export const initialState = {
  sending: false,
  sendingError: false,
  sendingSuccess: false,
}

/* eslint-disable default-case, no-param-reassign */
export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case POST_EMAIL:
        draft.sending = true
        draft.sendingError = false
        draft.sendingSuccess = false
        break
      case POST_EMAIL_SUCCESS:
        draft.sending = false
        draft.sendingError = false
        draft.sendingSuccess = true
        break
      case POST_EMAIL_ERROR:
        draft.sending = false
        draft.sendingError = action.error
        draft.sendingSuccess = false
        break
    }
  })
