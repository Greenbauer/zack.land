/*
 * App Actions
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
  LOAD_REPOS,
  LOAD_REPOS_SUCCESS,
  LOAD_REPOS_ERROR,
  POST_REPOS,
  CHANGE_PAGE_HEADER,
} from './constants'

// send repos

export function postRepos(repos) {
  return {
    type: POST_REPOS,
    repos
  }
}

// loading started

export function loadRepos() {
  return {
    type: LOAD_REPOS,
  }
}

// loading success

export function reposLoaded(repos) {
  return {
    type: LOAD_REPOS_SUCCESS,
    repos
  }
}

// loading fails

export function repoLoadingError(error) {
  return {
    type: LOAD_REPOS_ERROR,
    error,
  }
}

// change header title

export function changePageHeader(value) {
  return {
    type: CHANGE_PAGE_HEADER,
    title: value,
  }
}
