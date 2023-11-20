/**
 * The newly-designed renderer initialization module for ALAL.
 *
 * The original Alicorn Renderer entry is bloat and over-integrated. This module replace it
 * with focus on a clean and fast initialization process.
 */
import { ipcRenderer } from "electron";
import React from "react";
import { createRoot } from "react-dom/client";
import pkg from "../../../package.json";
import { Signals } from "../../background/Signals";
import { Locale } from "../../modules/i18n/Locale";
import { Paths } from "../../modules/redata/Paths";
import { ReOptions } from "../../modules/redata/ReOptions";
import { App } from "../screen/App";

export namespace ReInit {
    /**
     * Initialize the renderer environment.
     */
    export async function initRenderer() {
        handleLifecycleEvents();
        printVersionInfo();

        await initModules();

        // Wait for resources to complete loading, then prepare content
        if (document.readyState == "complete") {
            prepareContent();
        } else {
            window.addEventListener("load", prepareContent);
        }
    }

    /**
     * Close the window gently. Save all data and send a close request, then main process will
     * close the main window and exit.
     *
     * @param soft Don't trigger an app quit request. (Default: true)
     */
    export async function closeWindow(soft = true) {
        await beforeClose();
        ipcRenderer.send(soft ? Signals.CLOSE_WINDOW_SOFT : Signals.CLOSE_WINDOW_AND_QUIT);
    }

    // Handle events for window closing
    function handleLifecycleEvents() {
        ipcRenderer.on(Signals.USER_CLOSE_REQUEST, () => {void closeWindow(true);});
        ipcRenderer.on(Signals.USER_QUIT_REQUEST, () => {void closeWindow(false);});
    }

    // Init renderer-side modules
    async function initModules() {
        console.log("Loading and initializing modules.");
        Paths.detectRootPath();
        await Paths.retrieveAppPath();
        await ReOptions.load();
        await Locale.initLocale();
    }

    // Prepare render content before the window can be shown
    function prepareContent() {
        console.log("Preparing content to display.");

        // Render
        let rootElement = document.getElementById("root");
        if (!rootElement) {
            document.body.appendChild(rootElement = document.createElement("div"));
        }
        const root = createRoot(rootElement);
        root.render(React.createElement(App)); // Making this file pure TS


        console.log("All caught up! I'm now showing the window.");
        ipcRenderer.send(Signals.SHOW_MAIN_WINDOW);
    }

    function printVersionInfo() {
        console.log(`Alicorn Again (ALAL) ${pkg.appVersion} ${pkg.updatorVersion}`);
        console.log("This is ReInit for ALAL. Leaving everything behind.");
        console.log("%c❤ From Annie K Rarity Sparklight", "color:#df307f;font-weight:bold;");
        console.log("%cALAL Forked and re-designed by skjsjhb", "color: #f8d854;font-weight:bold;");
        console.log("Alicorn Launcher Copyright (C) 2021-2022 Annie K Rarity Sparklight");
        console.log('Alicorn Again Launcher Copyright (C) 2023 Ted "skjsjhb" Gao');
        console.log("This program comes with ABSOLUTELY NO WARRANTY; for details, please see 'resources/app/LICENSE'.");
        console.log("This is free software, and you are welcome to redistribute it under certain conditions; see the license file for details.");
    }

    async function beforeClose() {
        await ReOptions.save();
    }
}