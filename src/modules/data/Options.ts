import { Signals } from "@/background/Signals";
import { Files } from "@/modules/data/Files";
import { ipcRenderer } from "electron";
import { outputJSON, readJSON } from "fs-extra";
import OptionsTemplate from "../../constra/options.json";
import { Objects } from "../util/Objects";
import { Paths } from "./Paths";

/**
 * ReOptions, aka. Config v2. The newly designed options system for alal.js.
 *
 * This module is designed to solve major issues in Alicorn Config:
 * - Config handling is cumbersome for both main process and renderer process.
 * - The lack of type system for config files.
 */
export namespace Options {
    type OptionsModel = typeof OptionsTemplate;

    const OPTIONS_FILE_PATH = "options.json";
    let options: OptionsModel = OptionsTemplate;

    /**
     * Loads options from `options.json`.
     */
    export async function load() {
        try {
            const optnPath = Paths.getDataPath(OPTIONS_FILE_PATH);
            if (!await Files.exists(optnPath)) {
                console.log("Options file not present, skipped.");
                return;
            }
            console.log("Loading options file.");
            const overrides = await readJSON(optnPath);
            Objects.merge(options, overrides);
        } catch (e) {
            console.error("Failed to load options file: " + e);
        }
    }

    /**
     * Get the options file as model.
     *
     * A common practice of using this method is unpacking the data, e.g.
     * ```js
     * const {width, height} = ReOptions.get().windowSize;
     * ```
     */
    export function get(): OptionsModel {
        return options;
    }

    /**
     * Save the option file.
     */
    export async function save() {
        try {
            await outputJSON(Paths.getDataPath(OPTIONS_FILE_PATH), options);
        } catch (e) {
            console.error("Failed to save options file: " + e);
        }
    }

    /**
     * Notify the main process to reload the options.
     *
     * Changes only happen in render process, by syncing to the main process some of them
     * take effect instantly.
     */
    export async function requestMainReload() {
        await save();
        await ipcRenderer.invoke(Signals.RELOAD_OPTIONS);
    }
}