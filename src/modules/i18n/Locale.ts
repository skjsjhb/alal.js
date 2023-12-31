import { MAPI } from '@/background/MAPI';
import { opt } from '@/modules/data/Options';
import { getResourcePath } from '@/modules/data/Paths';
import { isRemote } from '@/modules/util/Availa';
import { getObjectPropertyByKey } from '@/modules/util/Objects';
import { app, ipcRenderer } from 'electron';
import { readFile } from 'fs-extra';
import yaml from 'yaml';

let currentLocale = '';
const locales: Record<string, object> = {};

/**
 * Initializes the locale module: loads locale files from a pre-set directory, then set the current locale
 * based on options or os.
 */
export async function initLocale() {
    let userLocale;
    if (isRemote()) {
        // Remote
        userLocale = opt().locale || (await ipcRenderer.invoke(MAPI.GET_LOCALE));
    } else {
        // Background
        userLocale = opt().locale || app.getLocale();
    }
    await setActiveLocale(userLocale);
}

async function readLocale(id: string): Promise<void> {
    try {
        const f = getResourcePath('lang', id + '.yml');
        locales[id] = yaml.parse((await readFile(f)).toString());
    } catch (e) {
        console.error('Could not load locale %s: %s', id, e);
    }
}

/**
 * Sets specified locale as active. Following calls to locale state-based translation methods will
 * be affected.
 *
 * This method does not require the target locale to have been built. The locale retrieval is only done
 * when the translation method is called.
 */
export async function setActiveLocale(id: string) {
    console.log('Active locale: ' + id);
    currentLocale = id;
    if (!locales[currentLocale]) {
        console.log('Loading locale: ' + currentLocale);
        await readLocale(currentLocale);
    }
}

/**
 * Gets the translation of a specified key. Optionally using an argument list.
 *
 * String templates have `${name}` as their placeholder.
 */
export function getTranslation(key: string, vars?: Record<string, any>): string {
    if (!currentLocale || !locales[currentLocale]) {
        console.warn('Attempting to get translation when locale is not set. Skipped.');
        return '';
    }
    const v = getObjectPropertyByKey(locales[currentLocale], key);
    if (typeof v == 'string') {
        return applyVars(v, vars);
    }
    console.warn(`Translation key ${key} does not map to a valid value. Check lang files.`);
    return ''; // Invalid values are skipped
}

/**
 * Alias for {@link getTranslation}.
 */
export const TR = getTranslation;

/**
 * Generates a function which wraps {@link getTranslation}, using `rootKey` as prefix.
 * @param rootKey Key prefix to attach.
 */
export function getLocaleSection(rootKey: string): (key: string, vars?: Record<string, any>) => string {
    return (k, v) => getTranslation(rootKey + '.' + k, v);
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
