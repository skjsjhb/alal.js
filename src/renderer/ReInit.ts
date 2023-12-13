/**
 * The newly-designed renderer initialization module for alal.js.
 *
 * The original Alicorn Renderer entry is bloat and over-integrated. This module replace it
 * with focus on a clean and fast initialization process.
 */
import { MAPI } from '@/background/MAPI';
import { loadOptions, saveOptions } from '@/modules/data/Options';
import { retrieveAppPath } from '@/modules/data/Paths';
import { loadRegTables, saveRegTables } from '@/modules/data/Registry';
import { initLocale } from '@/modules/i18n/Locale';
import { initJavaGet } from '@/modules/jem/JavaGet';
import { initCache } from '@/modules/net/Cacher';
import { updateMirrors } from '@/modules/net/Mirrors';
import { ipcRenderer } from 'electron';
import React from 'react';
import { createRoot } from 'react-dom/client';
import pkg from '../../package.json';
import { App } from './App';

/**
 * Initialize the renderer environment.
 */
export async function initRenderer() {
    handleLifecycleEvents();
    printVersionInfo();

    await initModules();

    // Wait for resources to complete loading, then prepare content
    if (document.readyState == 'complete') {
        prepareContent();
    } else {
        window.addEventListener('load', prepareContent);
    }

    // Post init steps
    console.log('Running post-init tasks.');
    await postInit();
}

/**
 * Close the window gently. Save all data and send a close request, then main process will
 * close the main window and exit.
 *
 * @param soft Don't trigger an app quit request. (Default: true)
 */
export async function closeWindow(soft = true) {
    await beforeClose();
    ipcRenderer.send(soft ? MAPI.CLOSE_WINDOW_SOFT : MAPI.CLOSE_WINDOW_AND_QUIT);
}

// Handle events for window closing
function handleLifecycleEvents() {
    ipcRenderer.on(MAPI.USER_CLOSE_REQUEST, () => {
        void closeWindow(true);
    });
    ipcRenderer.on(MAPI.USER_QUIT_REQUEST, () => {
        void closeWindow(false);
    });
}

// Init renderer-side modules
async function initModules() {
    console.log('Loading and initializing modules.');
    await retrieveAppPath();
    await loadOptions();
    await initLocale();
    await loadRegTables();
}

// Tasks to run after renderer initialization
async function postInit() {
    await initJavaGet();
    await initCache();
    await updateMirrors();
}

// Prepare render content before the window can be shown
function prepareContent() {
    console.log('Preparing content to display.');

    // Render
    let rootElement = document.getElementById('root');
    if (!rootElement) {
        document.body.appendChild((rootElement = document.createElement('div')));
    }
    const root = createRoot(rootElement);
    root.render(React.createElement(App));

    console.log("All caught up! I'm now showing the window.");
    ipcRenderer.send(MAPI.SHOW_MAIN_WINDOW);
}

function printVersionInfo() {
    console.log(`alal.js ${pkg.versionName} ${pkg.version}`);
    console.log('This is ReInit for alal.js. Leaving everything behind.');
    console.log('%calal.js Forked and re-designed by skjsjhb', 'color: #f8d854;font-weight:bold;');
    console.log('alal.js Copyright (C) 2023 Ted "skjsjhb" Gao');
    console.log("This program comes with ABSOLUTELY NO WARRANTY; for details, please see 'resources/app/LICENSE'.");
    console.log(
        'This is free software, and you are welcome to redistribute it under certain conditions; see the license file for details.'
    );
}

async function beforeClose() {
    await saveOptions();
    await saveRegTables();
}

if (process.env.MODE == 'debug') {
    console.warn('Enabling HMR. This is for development only and brings severe risks if used in production.');
    // @ts-expect-error Webpack Module API is not typed
    module.hot && module.hot.accept();
}
