import { MicrosoftBrowserLogin } from "@/modules/reauth/MicrosoftBrowserLogin";
import { ReOptions } from "@/modules/redata/ReOptions";
import { app, ipcMain } from "electron";
import { Signals } from "./Signals";

/**
 * Backend handlers registry module.
 */
export namespace Handlers {
    const BINDINGS = {
        [Signals.GET_APP_PATH]: getAppPath,
        [Signals.RELOAD_OPTIONS]: reloadOptions,
        [Signals.GET_LOCALE]: getLocale,
        [Signals.MICROSOFT_LOGIN]: MicrosoftBrowserLogin.loginWithBrowserWindow
    };

    /**
     * Create native handlers.
     */
    export function createBindings() {
        for (const [k, v] of Object.entries(BINDINGS)) {
            console.log("Binding: " + k);
            ipcMain.handle(k, v);
        }
    }

    async function getLocale() {
        return app.getLocale();
    }

    // Reload options file
    async function reloadOptions() {
        console.log("Reloading options.");
        await ReOptions.load();
    }

    async function getAppPath() {
        return app.getAppPath();
    }
}