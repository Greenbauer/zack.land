/*
 * ContactReducer
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
  LOAD_EMAIL_SUCCESS,
  LOAD_EMAIL_ERROR,
  POST_EMAIL,
  CHANGE_EMAIL_DATA,
} from './constants'

// The initial state of the App
const initialState = fromJS({
  name: '',
  email:'',
  subject: '',
  message: '',
})

function contactReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_EMAIL_DATA:
      return state
        .set(action.name, action.value)
        .set('loading', false)
        .set('error', false)
        .set('success', false)
      case POST_EMAIL:
        return state
          .set('loading', true)
          .set('error', false)
          .set('success', false)
      case LOAD_EMAIL_SUCCESS:
        return state
          .set('loading', false)
          .set('success', true)
      case LOAD_EMAIL_ERROR:
        return state
          .set('error', action.error)
          .set('success', false)
          .set('loading', false)
      default:
      return state
  }
}

export default contactReducer
