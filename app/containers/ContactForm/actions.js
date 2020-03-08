/*
 * Contact Actions
 */

import { POST_EMAIL_SUCCESS, POST_EMAIL_ERROR, POST_EMAIL } from './constants'

/**
 * @param {object} data
 */
export function sendEmail(data) {
  return {
    type: POST_EMAIL,
    data,
  }
}

export function emailSent() {
  return {
    type: POST_EMAIL_SUCCESS,
  }
}

/**
 * @param {object} error
 */
export function emailSendingError(error) {
  return {
    type: POST_EMAIL_ERROR,
    error,
  }
}
