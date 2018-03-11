// ContactPage Saga

import { call, put, select, takeLatest } from 'redux-saga/effects'
import { POST_EMAIL } from './constants'
import { reposLoaded, repoLoadingError } from './actions'

import request from 'utils/request'

// Send email too server

export function* postToServer(data) {
    try {
      // Call our request helper (see 'utils/request')
      const repos = yield call(request, '/email', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(data.repos)
      })
      yield put(reposLoaded(repos))

    } catch (err) {
      yield put(repoLoadingError(err))
    }
 }

// Root saga manages watcher lifecycle

export default function* rootSaga() {
  yield takeLatest(POST_EMAIL, postToServer)
}
