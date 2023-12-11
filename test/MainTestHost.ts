import { app, ipcMain } from 'electron';
import { SignalTest } from './SignalTest';

function processArgs(args: any[]): any[] {
    let main = args.shift();
    if (typeof main == 'string') {
        main = '[Remote] ' + main;
    }
    args.unshift(main);
    return args;
}

export function runMainTests() {
    console.log('Automate tests for main process.');

    ipcMain.on(SignalTest.LOG_DEBUG, (_event, ...args) => {
        console.log(...processArgs(args));
    });
    ipcMain.on(SignalTest.LOG_WARN, (_event, ...args) => {
        console.warn(...processArgs(args));
    });
    ipcMain.on(SignalTest.LOG_ERR, (_event, ...args) => {
        console.error(...processArgs(args));
    });
    ipcMain.once(SignalTest.EXIT, () => {
        console.log('Exiting!');
        app.exit(0);
    });
}