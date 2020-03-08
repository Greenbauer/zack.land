import produce from 'immer'
import { CHANGE_PAGE_HEADER } from './constants'

// The initial state of the App
export const initialState = {}

/* eslint-disable default-case, no-param-reassign */
export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case CHANGE_PAGE_HEADER:
        draft.title = action.title
        break
    }
  })
