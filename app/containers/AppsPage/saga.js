// AppsPage Saga

import { call, put, select, takeLatest } from 'redux-saga/effects'

import request from 'utils/request'

import { dataLoaded, dataLoadingError } from './actions'
import { LOAD_CODEPEN } from './constants'

export function* getCodepenCollection() {
  // get behance profile published projects data
  try {
    // Call our request helper (see 'utils/request')
    const codepenCollection = yield call(request, '/codepen', {
    method: 'GET',
  })
    yield put(dataLoaded(codepenCollection))

  } catch (err) {
    yield put(dataLoadingError(err))
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* rootSaga() {
  yield takeLatest(LOAD_CODEPEN, getCodepenCollection)
}
