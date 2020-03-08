/*
 * App Actions
 */

import { CHANGE_PAGE_HEADER } from './constants'

/**
 * Dispatched when changing the page title
 *
 * @param  {string} title Page title
 * @return {object} An action object with a type of CHANGE_PAGE_HEADER passing the page title
 */

export function changePageHeader(title) {
  return {
    type: CHANGE_PAGE_HEADER,
    title,
  }
}
