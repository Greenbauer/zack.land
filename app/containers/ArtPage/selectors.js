import { createSelector } from 'reselect'
import { initialState } from './reducer'

const selectArt = state => state.art || initialState

export const makeBehanceData = () =>
  createSelector(
    selectArt,
    artState => artState.data,
  )

export const makeBehanceLoading = () =>
  createSelector(
    selectArt,
    artState => artState.loading,
  )

export const makeBehanceError = () =>
  createSelector(
    selectArt,
    artState => artState.error,
  )

export const makeBehanceSuccess = () =>
  createSelector(
    selectArt,
    artState => artState.success,
  )
