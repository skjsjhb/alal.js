import { MicrosoftBrowserLogin } from "@/modules/reauth/MicrosoftBrowserLogin";
import { ReOptions } from "@/modules/redata/ReOptions";
import { Downloader } from "@/modules/renet/Downloader";
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
        await ReOptions.load();
    }

    async function getAppPath() {
        return app.getAppPath();
    }

    // Wrapper method for webGetFileMain
    function webGetFileMainProc(_e: IpcMainInvokeEvent, u: string, l: string, t: number, m: number): Promise<void> {
        return Downloader.webGetFileMain(u, l, t, m);
    }
}