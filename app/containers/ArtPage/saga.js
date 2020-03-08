import { call, put, takeLatest } from 'redux-saga/effects'

import request from 'utils/request'

import { dataLoaded, dataLoadingError } from './actions'
import { LOAD_BEHANCE } from './constants'

export function* getBehanceProfile() {
  // get behance profile published projects data
  try {
    const data = yield call(request, '/behance', {
      method: 'GET',
    })
    yield put(dataLoaded(data))
  } catch (err) {
    yield put(dataLoadingError(err))
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* rootSaga() {
  yield takeLatest(LOAD_BEHANCE, getBehanceProfile)
}
