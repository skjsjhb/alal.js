/**
 * Defines constants for possible invocation and message channels between main process and renderer.
 */
export enum MAPI {
    SHOW_MAIN_WINDOW = 'showMainWindow',
    USER_CLOSE_REQUEST = 'userCloseRequest',
    USER_QUIT_REQUEST = 'userQuitRequest',
    CLOSE_WINDOW_SOFT = 'closeWindowSoft',
    CLOSE_WINDOW_AND_QUIT = 'closeWindowAndQuit',
    RELOAD_OPTIONS = 'reloadOptions',
    GET_APP_PATH = 'getAppPath',
    GET_LOCALE = 'getLocale',
    WINDOW_RESIZE = 'windowResize',
    MICROSOFT_LOGIN = 'msLogin',
    GET_PROXY = 'getProxy',
    CHECK_ENCRYPT = 'checkEncrypt',
    ENCRYPT = 'encrypt',
    DECRYPT = 'decrypt',
    SELECT_FOLDER = 'selectFolder'
}
