/*
 * ArtPage Actions
 */

import {
  LOAD_BEHANCE_SUCCESS,
  LOAD_BEHANCE_ERROR,
  LOAD_BEHANCE,
} from './constants'

/**
 * Dispatched when acessing the REST API
 *
 * @return {object} An action object with a type of LOAD_BEHANCE passing the Redux Saga
 */

export function loadData() {
  return {
    type: LOAD_BEHANCE,
  }
}

/**
 * Dispatched when loading from the REST API is successful
 *
 * @param  {string} data Data from REST API
 * @return {object} An action object with a type of LOAD_BEHANCE_SUCCESS passing the REST API data
 */

export function dataLoaded(data) {
  return {
    type: LOAD_BEHANCE_SUCCESS,
    data,
  }
}

/**
 * Dispatched when loading from the REST API fails
 *
 * @param  {string} error Page title
 * @return {object} An action object with a type of LOAD_BEHANCE_ERROR passing the REST API error
 */

export function dataLoadingError(error) {
  return {
    type: LOAD_BEHANCE_ERROR,
    error,
  }
}
