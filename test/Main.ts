/**
 * The entry point of the new bootloader for autotest bundles.
 */
import { bootloaderMain } from '@/background/BootLoader';
import { runMainTests } from './MainTestHost';

async function main() {
    await bootloaderMain();

    // Autotest modules entry
    console.warn('This is a test bundle built for automated tests. They are NOT intended for normal use.');
    console.warn('For development, use the debug bundle instead.');
    console.warn('For a production ready app, see the release bundle.');
    await runMainTests();
}

void main();
