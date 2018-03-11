/*
 * ArtPage Actions
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
  LOAD_BEHANCE_SUCCESS,
  LOAD_BEHANCE_ERROR,
  LOAD_BEHANCE,
} from './constants'

// loading started

export function loadData() {
  return {
    type: LOAD_BEHANCE,
  }
}

// loading success

export function dataLoaded(data) {
  return {
    type: LOAD_BEHANCE_SUCCESS,
    data,
  }
}

// loading error

export function dataLoadingError(error) {
  return {
    type: LOAD_BEHANCE_ERROR,
    error,
  }
}
