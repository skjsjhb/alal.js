import { Options } from "@/modules/data/Options";
import { app, BrowserWindow, Event, ipcMain, screen } from "electron";
import os from "os";
import path from "path";
import { Signals } from "./Signals";

/**
 * Multiple browser window management module.
 */
export namespace WindowManager {
    let mainWindow: BrowserWindow | null = null;

    /**
     * Initialize the main window.
     *
     * This method should only be called once. The main window will remain open during the whole
     * app lifecycle.
     */
    export async function initMainWindow() {
        // Creation
        console.log("Creating app main window.");
        const [width, height] = getPreferredWindowSize();
        mainWindow = new BrowserWindow({
            width, height,
            webPreferences: {
                nodeIntegration: true,
                nodeIntegrationInWorker: true,
                sandbox: false,
                contextIsolation: false,
                spellcheck: false,
                defaultEncoding: "utf-8",
                backgroundThrottling: false,
                webgl: true,
                devTools: Options.get().dev ?? false
            },
            show: false
        });
        mainWindow.setAspectRatio(1.92);
        mainWindow.setTitle("ALAL");
        mainWindow.setMenu(null);

        // Minimum event listeners
        console.log("Binding main window event listeners.");
        ipcMain.on(Signals.SHOW_MAIN_WINDOW, mainWindow.show.bind(mainWindow)); // If not bound a TypeError will occur
        ipcMain.on(Signals.CLOSE_WINDOW_SOFT, closeWindowSoft); // Paired with userCloseWindowRequest & DOM close events
        ipcMain.on(Signals.CLOSE_WINDOW_AND_QUIT, closeWindowAndQuit); // Paired with userQuitRequest
        mainWindow.on("close", onUserCloseWindowReq);
        mainWindow.on("resized", pushMainWindowResizeEvent);
        app.once("before-quit", onUserQuitReq); // This is done by WM to prevent early quit

        // Network setup
        unblockCORS(mainWindow);

        // Open Devtools in case window failures
        if (Options.get().dev) {
            console.log("Opening devtools.");
            mainWindow.webContents.openDevTools();
        }

        // Load content
        await mainWindow.loadFile(path.resolve(app.getAppPath(), "renderer.html"));
    }

    /**
     * Gets the main window.
     */
    export function getMainWindow(): BrowserWindow | null {
        return mainWindow;
    }

    /**
     * Calculates a suitable window size according to display size.
     */
    export function getPreferredWindowSize() {
        const size = screen.getPrimaryDisplay().workAreaSize;
        const height = Math.floor(size.height * 0.55);
        const width = Math.floor(height * 1.92);
        return [width, height];
    }

    function pushMainWindowResizeEvent() {
        mainWindow?.webContents.send(Signals.WINDOW_RESIZE, mainWindow?.getSize());
    }


    // Called when the renderer is ready for closing gently. i.e. Hide on macOS and close on others.
    function closeWindowSoft() {
        if (os.platform() == "darwin") {
            console.log("Hiding main window.");
            mainWindow?.hide();
        } else {
            console.log("Closing main window.");
            mainWindow?.removeListener("close", onUserCloseWindowReq); // Prevent infinite loop
            mainWindow?.close();
            mainWindow = null;
            app.removeAllListeners("before-quit");
            app.quit();
        }
    }

    // For response to app quit event. This indicates that the renderer is ready for an app-level quit.
    function closeWindowAndQuit() {
        console.log("Closing and exiting.");
        mainWindow?.removeListener("close", onUserCloseWindowReq);
        mainWindow?.close();
        mainWindow = null;
        app.removeAllListeners("before-quit");
        app.quit(); // On macOS the exit has to be triggered manually, no-op for other platforms.
    }

    // Handle event when user are requesting the app to quit (not closing any window).
    function onUserQuitReq(e: Event) {
        console.log("User is requesting for app quit. Yes, but gracefully...");
        e.preventDefault();
        mainWindow?.hide();
        mainWindow?.webContents.send(Signals.USER_QUIT_REQUEST);
    }

    // The user created window closing request (e.g. Alt+F4) is not dispatched on the renderer process.
    // This method forward them.
    function onUserCloseWindowReq(e: Event) {
        console.log("User is requesting main window to close. I'm exiting, gracefully...");
        e.preventDefault();
        mainWindow?.hide();
        mainWindow?.webContents.send(Signals.USER_CLOSE_REQUEST);
    }


    function unblockCORS(window: BrowserWindow) {
        console.log("Unblocking CORS for window " + window.getTitle());

        window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            // The session object can be shared, check for ID first
            if (details.id == window.webContents.id) {
                if (!details.responseHeaders) {
                    details.responseHeaders = {};
                }
                details.responseHeaders["Access-Control-Allow-Origin"] = ["*"];
            }
            callback(details);
        });
    }
}