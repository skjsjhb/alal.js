/**
 * Defines constants for possible invocation and message channels between backend process and renderer.
 */

export namespace Signals {
    export const SHOW_MAIN_WINDOW = "showMainWindow";
    export const USER_CLOSE_REQUEST = "userCloseRequest";
    export const USER_QUIT_REQUEST = "userQuitRequest";
    export const CLOSE_WINDOW_SOFT = "closeWindowSoft";
    export const CLOSE_WINDOW_AND_QUIT = "closeWindowAndQuit";
    export const RELOAD_OPTIONS = "reloadOptions";
    export const GET_APP_PATH = "getAppPath";
    export const GET_LOCALE = "getLocale";
    export const WINDOW_RESIZE = "windowResize";
}