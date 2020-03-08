import { call, put, takeLatest } from 'redux-saga/effects'
import request from 'utils/request'
import { POST_EMAIL } from './constants'
import { emailSent, emailSendingError } from './actions'

/**
 * Send email to server
 *
 * @param {object} action Post email data
 */
export function* postEmail(action) {
  try {
    yield call(request, '/email', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(action.data),
    })

    yield put(emailSent())
  } catch (err) {
    yield put(emailSendingError(err))
  }
}

export default function* rootSaga() {
  yield takeLatest(POST_EMAIL, postEmail)
}
