import { Signals } from "@/background/Signals";
import { ipcRenderer } from "electron";

/**
 * A simple wrapper to `fetch` with JSON returned and mirrors applied. Errors are properly handled.
 */
export async function fetchJSON(url: string, init?: RequestInit): Promise<any> {
    if (ipcRenderer) {
        const {Mirrors} = await import("@/modules/net/Mirrors");
        const mirror = Mirrors.apply(url);
        return await ipcRenderer.invoke(Signals.FETCH_JSON_MAIN, mirror, init);
    } else {
        console.error("This method can only be called from the renderer.");
        return null;
    }
}

export namespace FetchUtil {
    export async function fetchJSONMain(url: string, init?: RequestInit): Promise<any> {
        try {
            const response = await fetch(url, init);
            if (!response.ok) {
                console.error("Invalid status received for " + url + ": " + response.status);
                return null;
            }
            return await response.json();
        } catch (e) {
            console.error("Could not fetch " + url + ": " + e);
        }
    }
}