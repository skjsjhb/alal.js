/**
 * The brand-new bootloader for alal.js.
 */

import { getMainWindow, initMainWindow } from '@/background/WindowManager';
import { loadOptions } from '@/modules/data/Options';
import { configureRuntimeDataRoot, retrieveAppPath } from '@/modules/data/Paths';
import { initLocale } from '@/modules/i18n/Locale';
import { app } from 'electron';
import os from 'os';
import { createBindings } from './Handlers';

/**
 * Bootloader main entry method.
 */
export async function bootloaderMain() {
    console.log('This is alal.js bootloader. Newer bootloader brings better performance.');
    await prepareRun();
    await app.whenReady();

    checkSingleInstance();
    bindErrorHandlers();
    bindAppLifecycleHandlers();

    console.log('Electron is ready. Starting launch process.');

    console.log('Welcome to Alicorn Again!');
    console.log(
        `alal.js with Electron ${process.versions['electron']}, ` +
            `Node.js ${process.versions['node']} and Chrome ${process.versions['chrome']}`
    );

    // Initialize the main window and wait until it loads
    await initMainWindow();
}

function bindErrorHandlers() {}

async function prepareRun() {
    console.log('alal.js backend is initializing, just a moment, hang tight...');
    console.log('Creating backend bindings.');
    createBindings();

    console.log('Loading config.');
    configureRuntimeDataRoot();
    await retrieveAppPath();
    await loadOptions();
    await initLocale();
}

function checkSingleInstance() {
    if (!app.requestSingleInstanceLock()) {
        console.log('Multiple instance detected, waking up the original one.');
        app.exit();
    }
}

function bindAppLifecycleHandlers() {
    app.on('window-all-closed', () => {
        // WM already handles quit when main window is closed. This approach avoids event listeners misfunction.
        if (os.platform() !== 'darwin') {
            app.removeAllListeners('before-quit'); // Prevent accidentally event catching
            app.quit();
        }
    });
    app.on('second-instance', () => {
        getMainWindow()?.show();
    });
    app.on('open-file', () => {
        getMainWindow()?.show();
    });
    app.on('open-url', () => {
        getMainWindow()?.show();
    });
}
