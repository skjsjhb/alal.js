/**
 * Defines constants for possible invocation and message channels between backend process and renderer.
 */

export module Signals {
    export const SHOW_MAIN_WINDOW = "showMainWindow";
    export const USER_CLOSE_REQUEST = "userCloseRequest";
    export const USER_QUIT_REQUEST = "userQuitRequest";
    export const CLOSE_WINDOW_SOFT = "closeWindowSoft";
    export const CLOSE_WINDOW_AND_QUIT = "closeWindowAndQuit";
    export const RELOAD_OPTIONS = "reloadOptions";
    export const GET_APP_PATH = "getAppPath";
    export const GET_LOCALE = "getLocale";
    export const WINDOW_RESIZE = "windowResize";
    export const MICROSOFT_LOGIN = "msLogin";
    export const WEB_GET_FILE = "webGetFile";
    export const FETCH_JSON_MAIN = "fetchJSONMain";
    export const FETCH_HEADERS_MAIN = "fetchHeadersMain";
    export const TEST_LATENCY = "testLatency";
    export const CHECK_ENCRYPT = "checkEncrypt";
    export const ENCRYPT = "encrypt";
    export const DECRYPT = "decrypt";
    export const SELECT_FOLDER = "selectFolder";
}