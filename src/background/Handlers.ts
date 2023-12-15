import { MAPI } from '@/background/MAPI';
import { runMicrosoftBrowserLoginMain } from '@/modules/auth/MicrosoftBrowserLogin';
import { loadOptions } from '@/modules/data/Options';
import { app, dialog, ipcMain, IpcMainInvokeEvent, safeStorage } from 'electron';

/**
 * Backend handlers registry module.
 */
const BINDINGS = {
    [MAPI.GET_APP_PATH]: getAppPath,
    [MAPI.RELOAD_OPTIONS]: reloadOptions,
    [MAPI.GET_LOCALE]: getLocale,
    [MAPI.MICROSOFT_LOGIN]: runMicrosoftBrowserLoginMain,
    [MAPI.GET_PROXY]: getProxy,
    [MAPI.CHECK_ENCRYPT]: checkEncrypt,
    [MAPI.ENCRYPT]: encryptString,
    [MAPI.DECRYPT]: decryptString,
    [MAPI.SELECT_FOLDER]: selectFolder
};

/**
 * Create native handlers.
 */
export function createBindings() {
    for (const [k, v] of Object.entries(BINDINGS)) {
        ipcMain.handle(k, v);
    }
}

async function getLocale() {
    return app.getLocale();
}

// Reload options file
async function reloadOptions() {
    console.log('Reloading options.');
    await loadOptions();
}

async function getAppPath() {
    return app.getAppPath();
}

function getProxy(e: IpcMainInvokeEvent, url: string): Promise<string> {
    return e.sender.session.resolveProxy(url);
}

function checkEncrypt(_e: IpcMainInvokeEvent): Promise<boolean> {
    return Promise.resolve(safeStorage.isEncryptionAvailable());
}

function encryptString(_e: IpcMainInvokeEvent, content: string): Promise<string> {
    return Promise.resolve(safeStorage.encryptString(content).toString('base64'));
}

function decryptString(_e: IpcMainInvokeEvent, content: string): Promise<string> {
    return Promise.resolve(safeStorage.decryptString(Buffer.from(content, 'base64')));
}

async function selectFolder(_e: IpcMainInvokeEvent, title: string): Promise<string[]> {
    return (await dialog.showOpenDialog({ properties: ['openDirectory', 'multiSelections'], title })).filePaths;
}
