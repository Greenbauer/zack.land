/*
 * Contact Actions
 *
 * Actions change things in your application
 * Since this boilerplate uses a uni-directional data flow, specifically redux,
 * we have these actions which are the only way your application interacts with
 * your application state. This guarantees that your state is up to date and nobody
 * messes it up weirdly somewhere.
 *
 * To add a new Action:
 * 1) Import your constant
 * 2) Add a function like this:
 *    export function yourAction(var) {
 *        return { type: YOUR_ACTION_CONSTANT, var: var }
 *    }
 */

import {
  LOAD_EMAIL_SUCCESS,
  LOAD_EMAIL_ERROR,
  POST_EMAIL,
  CHANGE_EMAIL_DATA,
} from './constants'

// changing the contact form input

export function changeEmailData(name, value) {
  return {
    type: CHANGE_EMAIL_DATA,
    name: name,
    value: value,
  }
}

// send email

export function postRepos(repos) {
  return {
    type: POST_EMAIL,
    repos
  }
}

// loading success

export function reposLoaded(repos) {
  return {
    type: LOAD_EMAIL_SUCCESS,
    repos,
  }
}

// loading error

export function repoLoadingError(error) {
  return {
    type: LOAD_EMAIL_ERROR,
    error,
  }
}
