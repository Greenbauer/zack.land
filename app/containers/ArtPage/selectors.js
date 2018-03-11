// ArtPage Selectors

import { createSelector } from 'reselect'

const selectArt = (state) => state.get('art')

const makeBehanceData = () => createSelector(
  selectArt,
  (artState) => artState.get('data')
  //(artState) => artState.getIn(['userData', 'dataitories'])
)

const makeBehanceLoading = () => createSelector(
  selectArt,
  (artState) => artState.get('loading')
)

const makeBehanceError = () => createSelector(
  selectArt,
  (artState) => artState.get('error')
)

const makeBehanceSuccess = () => createSelector(
  selectArt,
  (artState) => artState.get('success')
)

export {
  selectArt,
  makeBehanceLoading,
  makeBehanceError,
  makeBehanceSuccess,
  makeBehanceData,
}
