import { app, BrowserWindow, Event, ipcMain, screen } from "electron";
import os from "os";
import path from "path";
import { ReOptions } from "../modules/redata/ReOptions";
import { Signals } from "./Signals";

/**
 * Multiple browser window management module.
 */
export namespace WindowManager {

    let mainWindow: BrowserWindow;

    // Calculates a suitable window size according to display size
    function preferWindowSize() {
        const size = screen.getPrimaryDisplay().workAreaSize;
        const height = Math.floor(size.height * 0.55);
        const width = Math.floor(height * 1.92);
        return [width, height];
    }

    /**
     * Initialize the main window.
     *
     * This method should only be called once. The main window will remain open during the whole
     * app lifecycle.
     */
    export async function initMainWindow() {
        // Creation
        console.log("Creating app main window.");
        const [width, height] = preferWindowSize();
        mainWindow = new BrowserWindow({
            width, height,
            webPreferences: {
                nodeIntegration: true,
                nodeIntegrationInWorker: true,
                sandbox: false,
                contextIsolation: false,
                spellcheck: false,
                zoomFactor: ReOptions.get().ui.zoomFactor || 1,
                defaultEncoding: "utf-8",
                backgroundThrottling: false,
                webgl: true,
                devTools: ReOptions.get().dev.devtools || false
            },
            frame: ReOptions.get().ui.nativeFrame,
            show: false
        });
        mainWindow.setAspectRatio(1.92);
        mainWindow.setMenu(null);

        // Minimum event listeners
        console.log("Binding main window event listeners.");
        ipcMain.on(Signals.MAIN_WINDOW_READY, handleMainWindowReadyEvent);
        ipcMain.on(Signals.CLOSE_WINDOW_SOFT, closeWindowSoft); // Paired with userCloseRequest and DOM close events
        ipcMain.on(Signals.CLOSE_AND_QUIT, closeAndQuit); // Paired with userQuitRequest
        mainWindow.on("close", handleUserCloseRequest);

        // Open Devtools in case window failures
        if (ReOptions.get().dev.devtools) {
            console.log("Opening devtools.");
            mainWindow.webContents.openDevTools();
        }
        // Load content
        await mainWindow.loadFile(path.resolve(app.getAppPath(), "renderer.html"));
    }

    export function getMainWindow() {
        return mainWindow;
    }

    // The user created window closing request (e.g. Alt+F4) is not dispatched on the renderer process.
    // This method forward them.
    function handleUserCloseRequest(e: Event) {
        console.log("User is requesting main window to close. I'm exiting, gracefully...");
        e.preventDefault();
        mainWindow.hide();
        mainWindow.webContents.send(Signals.USER_CLOSE_REQUEST);
    }

    // Called when the renderer is ready for closing gently. i.e. Hide on macOS and close on others.
    function closeWindowSoft() {
        if (os.platform() == "darwin") {
            console.log("Hiding main window.");
            mainWindow.hide();
        } else {
            console.log("Closing main window.");
            mainWindow.removeListener("close", handleUserCloseRequest); // Prevent infinite loop
            mainWindow.close(); // Also triggers the app to quit
        }
    }

    // For response to app quit event. This indicates that the renderer is ready for an app-level quit.
    function closeAndQuit() {
        console.log("Closing and exiting.");
        mainWindow.removeListener("close", handleUserCloseRequest);
        mainWindow.close();
        app.removeAllListeners("before-quit");
        app.quit(); // On macOS the exit has to be triggered manually, no-op for other platforms.
    }

    /**
     * Forward the user quit event to the renderer and notify the main window to save
     * data and do an exit.
     *
     * On macOS, the app won't exit even if all windows are closed. The app will only quit
     * when the user requires so.
     *
     * On all other platforms, the app will exit when the main window is closed.
     *
     * @param e Event instance. (Will be cancelled)
     */
    export function informRendererQuitEvent(e: Event) {
        console.log("User is requesting for app quit. Yes, but gracefully...");
        e.preventDefault();
        mainWindow.hide();
        mainWindow.webContents.send(Signals.USER_QUIT_REQUEST);
    }

    async function handleMainWindowReadyEvent() {
        mainWindowReady();
        await postWindowInit();
    }

    // Called after the window is shown
    async function postWindowInit() {
        // Init proxy
        const proxyAddress = ReOptions.get().proxy.address.trim();
        if (proxyAddress) {
            await mainWindow.webContents.session.setProxy({
                proxyRules: proxyAddress,
                proxyBypassRules: ReOptions.get().proxy.noProxy
            });
        }
    }

    /**
     * Show the main window.
     */
    export function mainWindowReady() {
        mainWindow.show();
    }
}