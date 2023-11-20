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
        mainWindow.setTitle("ALAL");

        // Minimum event listeners
        console.log("Binding main window event listeners.");
        ipcMain.on(Signals.SHOW_MAIN_WINDOW, mainWindow.show.bind(mainWindow)); // If not bound a TypeError will occur
        ipcMain.on(Signals.CLOSE_WINDOW_SOFT, closeWindowSoft); // Paired with userCloseWindowRequest & DOM close events
        ipcMain.on(Signals.CLOSE_WINDOW_AND_QUIT, closeWindowAndQuit); // Paired with userQuitRequest
        mainWindow.on("close", onUserCloseWindowReq);
        mainWindow.on("resized", pushMainWindowResizeEvent);
        app.once("before-quit", onUserQuitReq); // This is done by WM to prevent early quit

        // Network setup
        await setProxy(mainWindow);
        unblockCORS(mainWindow);

        // Open Devtools in case window failures
        if (ReOptions.get().dev.devtools) {
            console.log("Opening devtools.");
            mainWindow.webContents.openDevTools();
        }

        // Load content
        await mainWindow.loadFile(path.resolve(app.getAppPath(), "renderer.html"));
    }

    /**
     * Gets the main window.
     */
    export function getMainWindow() {
        return mainWindow;
    }

    function pushMainWindowResizeEvent() {
        mainWindow.webContents.send(Signals.WINDOW_RESIZE, mainWindow.getSize());
    }

    // Calculates a suitable window size according to display size
    function preferWindowSize() {
        const size = screen.getPrimaryDisplay().workAreaSize;
        const height = Math.floor(size.height * 0.55);
        const width = Math.floor(height * 1.92);
        return [width, height];
    }


    // Called when the renderer is ready for closing gently. i.e. Hide on macOS and close on others.
    function closeWindowSoft() {
        if (os.platform() == "darwin") {
            console.log("Hiding main window.");
            mainWindow.hide();
        } else {
            console.log("Closing main window.");
            mainWindow.removeListener("close", onUserCloseWindowReq); // Prevent infinite loop
            mainWindow.close();
            app.quit();
        }
    }

    // For response to app quit event. This indicates that the renderer is ready for an app-level quit.
    function closeWindowAndQuit() {
        console.log("Closing and exiting.");
        mainWindow.removeListener("close", onUserCloseWindowReq);
        mainWindow.close();
        app.removeAllListeners("before-quit");
        app.quit(); // On macOS the exit has to be triggered manually, no-op for other platforms.
    }

    // Handle event when user are requesting the app to quit (not closing any window).
    function onUserQuitReq(e: Event) {
        console.log("User is requesting for app quit. Yes, but gracefully...");
        e.preventDefault();
        mainWindow.hide();
        mainWindow.webContents.send(Signals.USER_QUIT_REQUEST);
    }

    // The user created window closing request (e.g. Alt+F4) is not dispatched on the renderer process.
    // This method forward them.
    function onUserCloseWindowReq(e: Event) {
        console.log("User is requesting main window to close. I'm exiting, gracefully...");
        e.preventDefault();
        mainWindow.hide();
        mainWindow.webContents.send(Signals.USER_CLOSE_REQUEST);
    }

    async function setProxy(window: BrowserWindow) {
        console.log("Setting proxy for window " + window.getTitle());
        const proxyAddress = ReOptions.get().proxy.address.trim();
        if (proxyAddress) {
            await window.webContents.session.setProxy({
                proxyRules: proxyAddress,
                proxyBypassRules: ReOptions.get().proxy.noProxy
            });
        }
    }

    function unblockCORS(window: BrowserWindow) {
        console.log("Unblocking CORS for window " + window.getTitle());
        window.webContents.session.webRequest.onBeforeSendHeaders(
            (details, callback) => {
                callback({requestHeaders: {Origin: '*', ...details.requestHeaders}});
            }
        );

        window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    'Access-Control-Allow-Origin': ['*'],
                    ...details.responseHeaders
                }
            });
        });
    }


}