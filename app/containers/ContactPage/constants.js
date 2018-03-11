/*
 * AppConstants
 * Each action has a corresponding type, which the reducer knows and picks up on.
 * To avoid weird typos between the reducer and the actions, we save them as
 * constants here. We prefix them with 'yourproject/YourComponent' so we avoid
 * reducers accidentally picking up actions they shouldn't.
 *
 * Follow this format:
 * export const YOUR_ACTION_CONSTANT = 'yourproject/YourContainer/YOUR_ACTION_CONSTANT';
 */

export const CHANGE_EMAIL_DATA = 'ContactPage/CHANGE_EMAIL_DATA'
export const POST_EMAIL = 'ContactPage/POST_EMAIL'
export const LOAD_EMAIL_SUCCESS = 'ContactPage/LOAD_EMAIL_SUCCESS'
export const LOAD_EMAIL_ERROR = 'ContactPage/LOAD_EMAIL_ERROR'
