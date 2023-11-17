/**
 * Defines constants for possible invocation and message channels between backend process and renderer.
 */

export namespace Signals {
    export const MAIN_WINDOW_READY = "mainWindowReady";
    export const USER_CLOSE_REQUEST = "userCloseRequest";
    export const USER_QUIT_REQUEST = "userQuitRequest";
    export const CLOSE_WINDOW_SOFT = "closeWindowSoft";
    export const CLOSE_AND_QUIT = "closeAndQuit";
    export const RELOAD_OPTIONS = "reloadOptions";
    export const GET_APP_PATH = "getAppPath";
}