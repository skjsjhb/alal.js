import { ipcRenderer } from "electron";
import { readdir, readFile, stat } from "fs-extra";
import path from "path";
import yaml from "yaml";
import { Signals } from "../../background/Signals";
import { Paths } from "../redata/Paths";
import { ReOptions } from "../redata/ReOptions";
import { Objects } from "../util/Objects";

export namespace Locale {
    let currentLocale = "";
    type LocaleObject = { [key: string]: LocaleObject | string | string[] };
    const locales = new Map<string, LocaleObject>();

    const localeDirname = "i18n";

    /**
     * Initializes the locale module: loads locale files from a pre-set directory, then set the current locale
     * based on options or os.
     */
    export async function initLocale() {
        console.log("Loading locales.");
        await loadLocaleFromDir(Paths.getResourcePath(localeDirname));
        const userLocale = ReOptions.get().locale || await ipcRenderer.invoke(Signals.GET_LOCALE);
        setActiveLocale(userLocale);
    }

    // Scan locale directory using absolute path and load all files within it
    async function loadLocaleFromDir(absRootPath: string) {
        try {
            const dirContent = await readdir(absRootPath);
            const filesToLoad = [];
            for (const f of dirContent) {
                const filePt = path.join(absRootPath, f);
                const s = await stat(filePt);
                if (s.isFile()) {
                    const name = path.basename(f, path.extname(f));
                    filesToLoad.push(loadLocaleFromFile(name, filePt));
                }
            }
            const results = await Promise.allSettled(filesToLoad);
            for (const r of results) {
                if (r.status == "rejected") {
                    console.error("A locale file could not be loaded: " + r.reason);
                }
            }
        } catch (e) {
            console.error("Could not load locale dir: " + e);
        }
    }

    // Loads locale from specified file
    async function loadLocaleFromFile(name: string, absPath: string) {
        try {
            const src = await readFile(absPath);
            buildLocale(name, src.toString());
        } catch (e) {
            console.error("Could not load locale file: " + e);
        }
    }

    // Builds locale and add it to locale map
    function buildLocale(id: string, src: string) {
        try {
            console.log("Building locale " + id);
            const parseResult = yaml.parse(src) as LocaleObject; // TODO verify locale object
            locales.set(id, parseResult);
        } catch (e) {
            console.error("Could not build locale " + id + ": " + e);
        }
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
     * Gets the translation of a specified key.
     */
    export function getTranslation(key: string): string {
        if (!currentLocale || !locales.has(currentLocale)) {
            console.warn("Attempting to get translation when locale is not set. Skipped.");
            return "";
        }
        const v = Objects.getPropertyByKey(locales.get(currentLocale), key);
        if (typeof v == "string") {
            return v;
        }
        console.warn(`Translation key ${key} does not map to a valid value. Check lang files.`);
        return ""; // Invalid values are skipped
    }
}