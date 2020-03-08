/*
 * ArtReducer
 */

import produce from 'immer'
import {
  LOAD_BEHANCE_SUCCESS,
  LOAD_BEHANCE_ERROR,
  LOAD_BEHANCE,
} from './constants'

// The initial state of the App
export const initialState = {
  data: undefined,
  loading: false,
  error: false,
  success: false,
}

/* eslint-disable default-case, no-param-reassign */
export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case LOAD_BEHANCE:
        draft.data = undefined
        draft.loading = true
        draft.error = false
        draft.success = false
        break
      case LOAD_BEHANCE_SUCCESS:
        draft.data = action.data
        draft.loading = false
        draft.error = false
        draft.success = true
        break
      case LOAD_BEHANCE_ERROR:
        draft.loading = false
        draft.error = action.error
        draft.success = false
        break
    }
  })
