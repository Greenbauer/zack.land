// AppsPage Selectors

import { createSelector } from 'reselect'

const selectApps = (state) => state.get('apps')

const makeCodepenData = () => createSelector(
  selectApps,
  (appsState) => appsState.get('codepenCollection')
)

const makeCodepenLoading = () => createSelector(
  selectApps,
  (appsState) => appsState.get('loading')
)

const makeCodepenError = () => createSelector(
  selectApps,
  (appsState) => appsState.get('error')
)

const makeCodepenSuccess = () => createSelector(
  selectApps,
  (appsState) => appsState.get('success')
)

export {
  selectApps,
  makeCodepenLoading,
  makeCodepenError,
  makeCodepenSuccess,
  makeCodepenData,
}
