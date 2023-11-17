import { ipcRenderer } from "electron";
import os from "os";
import path from "path";
import { Signals } from "../../main/Signals";

/**
 * Module for file path resolving and file management.
 *
 * ALAL stores its data with them divided into the following sections:
 * - `user`: User selections and histories (aka. implicit preferences)
 * - `asr`: Shared room for application generated data.
 * - `pkg`: Downloaded software packages and daemons.
 * - `tmp`: Temp data storage.
 *
 * From ALAL (SakuraKumo) no data will be saved using the Web Storage API.
 */
export namespace Paths {
    let rootPath: string;
    let appPath: string;

    /**
     * Automatically detect the root path of ALAL data folder.
     * ALAL lookups the following locations:
     * - Windows: `%LOCALAPPDATA%/AlicornAgain`
     * - macOS: `~/Library/Application Support/AlicornAgain`
     * - Others: `~/.alicorn-again`
     */
    export function detectRootPath() {
        switch (os.platform()) {
            case "win32":
                if (process.env.LOCALAPPDATA) {
                    rootPath = path.resolve(process.env.LOCALAPPDATA, "AlicornAgain");
                } else if (process.env.APPDATA) {
                    rootPath = path.resolve(process.env.APPDATA, "AlicornAgain");
                }
                break;
            case "darwin":
                rootPath = path.resolve(os.homedir(), "Library/Application Support/AlicornAgain");
                break;
        }
        if (!rootPath) {
            rootPath = path.resolve(os.homedir(), ".alicorn-again");
        }
        console.log("Setting root path: " + rootPath);
    }


    /**
     * Detect the app resource path.
     *
     * This method is a wrapper of {@link app.getAppPath}. This can only be called on the remote.
     */
    export async function retrieveAppPath() {
        appPath = await ipcRenderer.invoke(Signals.GET_APP_PATH);
        console.log("Setting app path: " + appPath);
    }

    /**
     * Resolve a given path relative to the root path.
     * @param pt Relative path.
     */
    export function get(pt: string) {
        if (!rootPath) {
            console.warn("Paths used with root uninitialized.");
            console.warn("This is completed on-demand this time, but the code should be checked to prevent future errors.");
            detectRootPath();
        }
        return path.resolve(rootPath, pt);
    }
}