/**
 * App options module.
 */
import { MAPI } from '@/background/MAPI';
import { hasFile } from '@/modules/data/Files';
import { getRuntimeDataPath } from '@/modules/data/Paths';
import { mergeObjects } from '@/modules/util/Objects';
import { ipcRenderer } from 'electron';
import { outputJSON, readJSON } from 'fs-extra';
import OptionsTemplate from '../../constra/options.json';

type OptionsModel = typeof OptionsTemplate;

const OPTIONS_FILE_PATH = 'options.json';
const options: OptionsModel = OptionsTemplate;

/**
 * Loads options from `options.json`.
 */
export async function loadOptions() {
    try {
        const optnPath = getRuntimeDataPath(OPTIONS_FILE_PATH);
        if (!(await hasFile(optnPath))) {
            console.log('Options file not present, skipped.');
            return;
        }
        console.log('Loading options file.');
        const overrides = await readJSON(optnPath);
        mergeObjects(options, overrides);
    } catch (e) {
        console.error('Failed to load options file: ' + e);
    }
}

/**
 * Get the options file as model.
 */
export function getOptions(): OptionsModel {
    return options;
}

/**
 * Alias for {@link getOptions}.
 */
export const opt = getOptions;

/**
 * Save the option file.
 */
export async function saveOptions() {
    try {
        await outputJSON(getRuntimeDataPath(OPTIONS_FILE_PATH), options, { spaces: 4 });
    } catch (e) {
        console.error('Failed to save options file: ' + e);
    }
}

/**
 * Notify the main process to reload the options.
 *
 * Changes only happen in render process, by syncing to the main process some of them
 * take effect instantly.
 */
export async function reloadMainOptions() {
    await saveOptions();
    await ipcRenderer.invoke(MAPI.RELOAD_OPTIONS);
}
