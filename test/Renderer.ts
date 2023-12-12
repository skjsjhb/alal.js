/**
 * Entry point of the new renderer for autotest bundles only.
 */
import { Options } from '@/modules/data/Options';
import { Paths } from '@/modules/data/Paths';
import { ReInit } from '@/renderer/ReInit';
import { ipcRenderer } from 'electron';
import { runRendererTests } from './RendererTestHost';
import { SignalTest } from './SignalTest';

async function main() {
    // Redirect logs for renderer
    console.debug = (...args: any[]) => {
        ipcRenderer.send(SignalTest.LOG_DEBUG, ...args);
    };
    console.warn = (...args: any[]) => {
        ipcRenderer.send(SignalTest.LOG_WARN, ...args);
    };
    console.error = (...args: any[]) => {
        ipcRenderer.send(SignalTest.LOG_ERR, ...args);
    };

    Paths.configureRuntimeDataRoot();
    await Paths.retrieveAppPath();
    Options.get().dev = true;
    Options.get().download.maxTasks = 5;
    Options.get().download.tries = 20;
    await Options.save();

    await ReInit.initRenderer();


    // Autotest modules entry
    console.warn('This is a test bundle built for automated tests. They are NOT intended for normal use.');
    console.warn('For development, use the debug bundle instead.');
    console.warn('For a production ready app, see the release bundle.');
    await runRendererTests();
}

void main();