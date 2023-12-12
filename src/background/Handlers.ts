import { MicrosoftBrowserLogin } from '@/modules/auth/MicrosoftBrowserLogin';
import { Options } from '@/modules/data/Options';
import { Downloader, DownloadProfile } from '@/modules/net/Downloader';
import { FetchUtil } from '@/modules/net/FetchUtil';
import { app, dialog, ipcMain, IpcMainInvokeEvent, safeStorage } from 'electron';
import fetch, { RequestInit } from 'electron-fetch';
import { MAPI } from './MAPI';

/**
 * Backend handlers registry module.
 */
export module Handlers {
    const BINDINGS = {
        [MAPI.GET_APP_PATH]: getAppPath,
        [MAPI.RELOAD_OPTIONS]: reloadOptions,
        [MAPI.GET_LOCALE]: getLocale,
        [MAPI.MICROSOFT_LOGIN]: MicrosoftBrowserLogin.loginInBrowserMain,
        [MAPI.WEB_GET_FILE]: webGetFileMainProc,
        [MAPI.FETCH_JSON_MAIN]: fetchJSONMainProc,
        [MAPI.FETCH_HEADERS_MAIN]: fetchHeadersMainProc,
        [MAPI.TEST_LATENCY]: testLatency,
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
            console.log('Binding: ' + k);
            ipcMain.handle(k, v);
        }
    }

    async function getLocale() {
        return app.getLocale();
    }

    // Reload options file
    async function reloadOptions() {
        console.log('Reloading options.');
        await Options.load();
    }

    async function getAppPath() {
        return app.getAppPath();
    }

    // Wrapper method for webGetFileMain
    function webGetFileMainProc(_e: IpcMainInvokeEvent, p: DownloadProfile) {
        return Downloader.webGetFileMain(p);
    }

    function fetchJSONMainProc(_e: IpcMainInvokeEvent, url: string, init?: RequestInit) {
        return FetchUtil.fetchJSONMain(url, init);
    }

    function fetchHeadersMainProc(_e: IpcMainInvokeEvent, url: string) {
        return FetchUtil.fetchHeadersMain(url);
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

    const latencyTestTries = 3;
    const latencyTestTimeout = 3000; // 3s is long enough for a HEAD request
    async function testLatency(_e: IpcMainInvokeEvent, url: string): Promise<number> {
        const dat = [];
        for (const _i of Array(latencyTestTries)) {
            const start = Date.now();
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort('Timeout'), latencyTestTimeout);
            try {
                await fetch(url, { method: 'HEAD', signal: controller.signal });
                clearTimeout(tid);
            } catch {
                return -1;
            }
            dat.push(Date.now() - start);
        }
        return Math.round(dat.reduce((a, b) => a + b) / dat.length);
    }

    async function selectFolder(_e: IpcMainInvokeEvent, title: string): Promise<string[]> {
        return (await dialog.showOpenDialog({ properties: ['openDirectory', 'multiSelections'], title })).filePaths;
    }
}