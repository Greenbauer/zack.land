// ArtPage Saga

import { call, put, select, takeLatest } from 'redux-saga/effects'

import request from 'utils/request'

import { dataLoaded, dataLoadingError } from './actions'
import { LOAD_BEHANCE } from './constants'

export function* getBehanceProfile() {
  // get behance profile published projects data
  try {
    // Call our request helper (see 'utils/request')
    const data = yield call(request, '/behance', {
    method: 'GET',
  })
    yield put(dataLoaded(data))
  } catch (err) {console.log(err)
    yield put(dataLoadingError(err))
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* rootSaga() {
  yield takeLatest(LOAD_BEHANCE, getBehanceProfile)
}
