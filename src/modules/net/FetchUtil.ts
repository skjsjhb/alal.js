import { Signals } from "@/background/Signals";
import { Options } from "@/modules/data/Options";
import { Availa } from "@/modules/util/Availa";
import { ipcRenderer } from "electron";

/**
 * A simple wrapper to `fetch` with JSON returned and mirrors applied. Errors are properly handled.
 */
export async function fetchJSON(url: string, init?: RequestInit): Promise<any> {
    if (Availa.isRemote()) {
        const {Mirrors} = await import("@/modules/net/Mirrors");
        const mirror = Mirrors.apply(url);
        return await ipcRenderer.invoke(Signals.FETCH_JSON_MAIN, mirror, init);
    } else {
        console.error("This method can only be called from the renderer.");
        return null;
    }
}

export namespace FetchUtil {
    // Fetch on main proc with tries
    export async function fetchJSONMain(url: string, init?: RequestInit): Promise<any> {
        const tries = Options.get().download.tries;
        let lastError;
        for (const _i of Array(tries)) {
            try {
                const response = await fetch(url, init);
                if (!response.ok) {
                    lastError = "Invalid status received for " + url + ": " + response.status;
                    if (response.status == 404) {
                        break; // No need to retry
                    }
                    continue;
                }
                return await response.json();
            } catch (e) {
                lastError = e;
            }
        }
        console.error("Could not fetch " + url + ": " + lastError);
        return null;
    }
}