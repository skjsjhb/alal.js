/**
 * Implement login / logout actions with Microsoft account using an embedded `BrowserWindow`.
 *
 * Unlike most modules, this can only be called on the background.
 */

import { MAPI } from '@/background/MAPI';
import { getPreferredWindowSize } from '@/background/WindowManager';
import Sources from '@/constra/sources.json';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { isRemote } from '@/modules/util/Availa';
import { BrowserWindow, dialog, Event, ipcRenderer, session } from 'electron';

const loginBrowserPart = 'persist:ms-login';

/**
 * Login to Microsoft account using `BrowserWindow`.
 *
 * alal.js detects the change of URL and extracts the authorization code once
 * the login is success.
 *
 * The first returned Promise is fulfilled when the window loading has complete. The
 * second fulfills when the code is present.
 */
export function runMicrosoftBrowserLogin(): Promise<string> {
    if (isRemote()) {
        return ipcRenderer.invoke(MAPI.MICROSOFT_LOGIN);
    } else {
        return runMicrosoftBrowserLoginMain();
    }
}

/**
 * Main process implementation of {@link runMicrosoftBrowserLogin}.
 */
export async function runMicrosoftBrowserLoginMain(): Promise<string> {
    if (ipcRenderer) {
        console.error('This method can only be called from main process!');
        return '';
    }
    return new Promise<string>((res) => {
        const window = createLoginBrowserWindow();

        (globalThis as any).msLoginWindow = window;
        window.on('closed', () => {
            delete (globalThis as any).msLoginWindow;
        });

        // Bind listeners
        window.webContents.on('did-stop-loading', checkURL);
        window.on('close', beforeLoginWindowClose);
        window.on('closed', () => {
            res('');
        }); // Fallback listener
        void window.loadURL(Sources.microsoftLogin);

        // Check URL on page load, extract code
        function checkURL() {
            const code = extractCode(window.webContents.getURL());
            if (code) {
                console.log('Microsoft login window has received a valid code. Resolving.');
                closeWindowHard(window);
                res(code);
            } else {
                window.isVisible() || window.show();
            }
        }

        // If the login hasn't completed but the window has received close signal
        async function beforeLoginWindowClose(e: Event) {
            e.preventDefault();

            console.log('Login window is being closed. Asking for confirm.');

            // Ask for user confirmation
            if (await confirmCancelLogin()) {
                console.log("OK I'm cancelling login.");
                closeWindowHard(window);
                res(''); // Cancelled
            } else {
                console.log('Continue login.');
            }
        }
    });
}

/**
 * Clear the partition of the login window, invalidating cookies and caches.
 */
export async function clearLoginData() {
    const part = session.fromPartition(loginBrowserPart);
    await part.clearStorageData();
    await part.clearCache();
    console.log('Cleared Microsoft account login data.');
}

// Close the window without letting this action to be captured.
function closeWindowHard(window: BrowserWindow) {
    window.removeAllListeners('close');
    window.removeAllListeners('closed');
    window.close();
}

// Show a dialog to confirm the closing
async function confirmCancelLogin(): Promise<boolean> {
    const sector = getLocaleSection('ms-browser-login.cancel-login');
    const result = await dialog.showMessageBox({
        message: sector('content'),
        title: sector('title'),
        type: 'warning',
        buttons: [sector('b-yes'), sector('b-no')],
        defaultId: 1,
        cancelId: 1
    });
    return result.response == 0;
}

// Create login browser window without native integration
function createLoginBrowserWindow(): BrowserWindow {
    const [width, height] = getPreferredWindowSize();
    return new BrowserWindow({
        width,
        height,
        // Users who dislike ads might close a suddenly appeared blank window accidentally.
        // By removing the frame this can be reduced.
        frame: false,
        // If the login has been cached, by hiding the window brings a better experience.
        show: false,
        webPreferences: {
            partition: loginBrowserPart
        }
    });
}

// Try to get the code param
function extractCode(url: string): string {
    const u = new URL(url);
    return u.searchParams.get('code') || '';
}
