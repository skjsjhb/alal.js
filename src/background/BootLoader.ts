import { Options } from "@/modules/data/Options";
import { Paths } from "@/modules/data/Paths";
import { Locale } from "@/modules/i18n/Locale";
import { app } from "electron";
import os from "os";
import { Handlers } from "./Handlers";
import { WindowManager } from "./WindowManager";

/**
 * The brand-new bootloader for alal.js.
 */
export namespace BootLoader {

    export async function bootloaderMain() {
        console.log("This is alal.js bootloader. Newer bootloader brings better performance.");
        await prepareRun();
        await app.whenReady();

        checkSingleInstance();
        bindErrorHandlers();
        bindAppLifecycleHandlers();

        console.log("Electron is ready. Starting launch process.");

        console.log("Welcome to Alicorn Again!");
        console.log(`alal.js with Electron ${process.versions["electron"]}, ` +
            `Node.js ${process.versions["node"]} and Chrome ${process.versions["chrome"]}`);

        // Initialize the main window and wait until it loads
        await WindowManager.initMainWindow();
    }

    function bindErrorHandlers() {
    }


    async function prepareRun() {
        console.log("alal.js backend is initializing, just a moment, hang tight...");
        console.log("Creating backend bindings.");
        Handlers.createBindings();

        console.log("Loading config.");
        Paths.detectRootPath();
        await Paths.retrieveAppPath();
        await Options.load();
        await Locale.initLocale();
    }

    function checkSingleInstance() {
        if (!app.requestSingleInstanceLock()) {
            console.log("Multiple instance detected, waking up the original one.");
            app.quit();
        }
    }

    function bindAppLifecycleHandlers() {
        app.on("window-all-closed", () => {
            // WM already handles quit when main window is closed. This approach avoids event listeners misfunction.
            if (os.platform() !== "darwin") {
                app.removeAllListeners("before-quit"); // Prevent accidentally event catching
                app.quit();
            }
        });
        app.on("second-instance", () => { WindowManager.getMainWindow()?.show();});
        app.on("open-file", () => { WindowManager.getMainWindow()?.show();});
        app.on("open-url", () => { WindowManager.getMainWindow()?.show();});
    }
}