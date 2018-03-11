/*
 * ArtReducer
 *
 * The reducer takes care of our data. Using actions, we can change our
 * application state.
 * To add a new action, add it to the switch statement in the reducer function
 *
 * Example:
 * case YOUR_ACTION_CONSTANT:
 *   return state.set('yourStateVariable', true);
 */
import { fromJS } from 'immutable'
import {
  LOAD_BEHANCE_SUCCESS,
  LOAD_BEHANCE_ERROR,
  LOAD_BEHANCE,
} from './constants'

// The initial state of the App
const initialState = fromJS({
  data: false,
  loading: false,
  error: false,
  success: false,
})

function artReducer(state = initialState, action) {
  switch (action.type) {
      case LOAD_BEHANCE:
        return state
          .set('data', false)
          .set('loading', true)
          .set('error', false)
          .set('success', false)
      case LOAD_BEHANCE_SUCCESS:
        return state
          .set('data', action.data)
          .set('loading', false)
          .set('success', true)
      case LOAD_BEHANCE_ERROR:
        return state
          .set('error', action.error)
          .set('success', false)
          .set('loading', false)
      default:
      return state
  }
}

export default artReducer
