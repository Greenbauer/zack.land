/**
 * The global state selectors
 */

import { createSelector } from 'reselect'
import { initialState } from './reducer'

const selectGlobal = state => state.global || initialState

const selectRouter = state => state.router

export const makeSelectLocation = () =>
  createSelector(
    selectRouter,
    routerState => routerState.location,
  )

export const updateHeaderTitle = () =>
  createSelector(
    selectGlobal,
    globalState => globalState.title,
  )
