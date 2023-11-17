import { app } from "electron";
import os from "os";
import { Paths } from "../modules/redata/Paths";
import { ReOptions } from "../modules/redata/ReOptions";
import { Handlers } from "./Handlers";
import { WindowManager } from "./WindowManager";

export namespace BootLoader {

    /**
     * The brand-new bootloader for ALAL.
     */
    async function prepareRun() {
        console.log("Electron is preparing and I'll do some prepare jobs now.");
        console.log("Creating backend bindings.");
        Handlers.createBindings();
        console.log("Loading config.");
        Paths.detectRootPath();
        await ReOptions.load();
    }

    function checkSingleInstance() {
        if (!app.requestSingleInstanceLock()) {
            console.log("Multiple instance detected, waking up the original one.");
            app.quit();
        }
    }

    function bindAppLifecycleHandlers() {
        app.on("window-all-closed", () => {
            if (os.platform() !== "darwin") {
                app.removeAllListeners("before-quit"); // Prevent accidentally event catching
                app.quit();
            }
        });
        app.once("before-quit", WindowManager.informRendererQuitEvent);
        app.on("second-instance", WindowManager.mainWindowReady);
    }


    export async function bootLoaderMain() {
        // Wait for Electron
        await Promise.all([prepareRun(), app.whenReady()]);
        checkSingleInstance();
        bindAppLifecycleHandlers();

        console.log("Electron is ready. Starting launch process.");

        console.log("Welcome to Alicorn Again!");
        console.log(`ALAL with Electron ${process.versions["electron"]}, Node.js ${process.versions["node"]} and Chrome ${process.versions["chrome"]}`);

        // Show window
        await WindowManager.initMainWindow();
    }
}