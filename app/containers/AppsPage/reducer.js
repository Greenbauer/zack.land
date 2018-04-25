/*
 * AppsReducer
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
  LOAD_CODEPEN_SUCCESS,
  LOAD_CODEPEN_ERROR,
  LOAD_CODEPEN,
} from './constants'

// The initial state of the App
const initialState = fromJS({
  codepenCollection: false,
  loading: false,
  error: false,
  success: false,
})

function appsReducer(state = initialState, action) {
  switch (action.type) {
      case LOAD_CODEPEN:
        return state
          .set('codepenCollection', false)
          .set('loading', true)
          .set('error', false)
          .set('success', false)
      case LOAD_CODEPEN_SUCCESS:
        return state
          .set('codepenCollection', action.codepenCollection)
          .set('loading', false)
          .set('success', true)
      case LOAD_CODEPEN_ERROR:
        return state
          .set('error', action.error)
          .set('success', false)
          .set('loading', false)
      default:
      return state
  }
}

export default appsReducer
