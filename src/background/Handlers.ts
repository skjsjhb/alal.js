import { MicrosoftBrowserLogin } from "@/modules/auth/MicrosoftBrowserLogin";
import { Options } from "@/modules/data/Options";
import { Downloader } from "@/modules/net/Downloader";
import { app, ipcMain } from "electron";
import { Signals } from "./Signals";

/**
 * Backend handlers registry module.
 */
export namespace Handlers {
    import IpcMainInvokeEvent = Electron.IpcMainInvokeEvent;
    const BINDINGS = {
        [Signals.GET_APP_PATH]: getAppPath,
        [Signals.RELOAD_OPTIONS]: reloadOptions,
        [Signals.GET_LOCALE]: getLocale,
        [Signals.MICROSOFT_LOGIN]: MicrosoftBrowserLogin.loginWithBrowserWindow,
        [Signals.WEB_GET_FILE]: webGetFileMainProc
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
        await Options.load();
    }

    async function getAppPath() {
        return app.getAppPath();
    }

    // Wrapper method for webGetFileMain
    function webGetFileMainProc(_e: IpcMainInvokeEvent, p: Downloader.DownloadProfile) {
        return Downloader.webGetFileMain(p);
    }
}