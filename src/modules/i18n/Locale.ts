import { Signals } from "@/background/Signals";
import { Options } from "@/modules/data/Options";
import { Availa } from "@/modules/util/Availa";
import { app, ipcRenderer } from "electron";
import { Objects } from "../util/Objects";

// Language imports
import enUS from "./en-US.yml";
import zhCN from "./zh-CN.yml";

export namespace Locale {
    let currentLocale = "";
    const locales: Record<string, any> = {
        "en-US": enUS,
        "zh-CN": zhCN
    };


    /**
     * Initializes the locale module: loads locale files from a pre-set directory, then set the current locale
     * based on options or os.
     */
    export async function initLocale() {
        let userLocale;
        if (Availa.isRemote()) {
            // Remote
            userLocale = Options.get().locale || await ipcRenderer.invoke(Signals.GET_LOCALE);
        } else {
            // Background
            userLocale = Options.get().locale || app.getLocale();
        }
        setActiveLocale(userLocale);
    }

    /**
     * Sets specified locale as active. Following calls to locale state-based translation methods will
     * be affected.
     *
     * This method does not require the target locale to have been built. The locale retrieval is only done
     * when the translation method is called.
     */
    export function setActiveLocale(id: string) {
        console.log("Active locale: " + id);
        currentLocale = id;
    }

    /**
     * Gets the translation of a specified key. Optionally using an argument list.
     *
     * String templates have `${name}` as their placeholder.
     */
    export function getTranslation(key: string, vars?: Record<string, any>): string {
        if (!currentLocale || !locales[currentLocale]) {
            console.warn("Attempting to get translation when locale is not set. Skipped.");
            return "";
        }
        const v = Objects.getPropertyByKey(locales[currentLocale], key);
        if (typeof v == "string") {
            return applyVars(v, vars);
        }
        console.warn(`Translation key ${key} does not map to a valid value. Check lang files.`);
        return ""; // Invalid values are skipped
    }

    /**
     * Generates a function which wraps {@link getTranslation}, using `rootKey` as prefix.
     * @param rootKey Key prefix to attach.
     */
    export function getSection(rootKey: string): (key: string, vars?: Record<string, any>) => string {
        return (k, v) => getTranslation(rootKey + "." + k, v);
    }

    /**
     * Gets the active locale.
     */
    export function getLocale(): string {
        return currentLocale;
    }


    // Put values into the template.
    function applyVars(str: string, vars?: Record<string, any>) {
        if (!vars) {
            return str;
        }
        return str.replace(/\$\{(\w+)}/g, (match, key) => {
            return vars[key] || match;
        });
    }
}