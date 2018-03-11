/*
 * AppReducer
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
  LOAD_REPOS_SUCCESS,
  LOAD_REPOS,
  LOAD_REPOS_ERROR,
  POST_REPOS,
  CHANGE_PAGE_HEADER,
} from './constants'

// The initial state of the App
const initialState = fromJS({
  loading: false,
  error: false,
  success: false,
  currentUser: false,
  userData: {
    repositories: false,
  },
})

function appReducer(state = initialState, action) {
  switch (action.type) {
    case POST_REPOS:
      return state
        .set('loading', true)
        .set('error', false)
        .set('success', false)
        .setIn(['userData', 'repositories'], false)
    case LOAD_REPOS:
      return state
        .set('loading', true)
        .set('error', false)
        .set('success', false)
        .setIn(['userData', 'repositories'], false)
    case LOAD_REPOS_SUCCESS:
      return state
        .setIn(['userData', 'repositories'], action.repos)
        .set('loading', false)
        .set('success', true)
        .set('currentUser', action.username)
    case LOAD_REPOS_ERROR:
      return state
        .set('error', action.error)
        .set('success', false)
        .set('loading', false)
    case CHANGE_PAGE_HEADER:
      return state
        .set('title', action.title)
    default:
      return state
  }
}

export default appReducer
