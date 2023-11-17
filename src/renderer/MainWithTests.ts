/**
 * Entry point of the new renderer for autotest bundles only.
 */
import { runRendererTests } from "../test/renderer/RendererTestHost";
import { ReInit } from "./reinit/ReInit";

async function main() {
    await ReInit.initRenderer();

    // Autotest modules entry
    console.warn("This is a test bundle built for automated tests. They are NOT intended for normal use.");
    console.warn("For development, use the debug bundle instead.");
    console.warn("For a production ready app, see the release bundle.");
    runRendererTests();
}

void main();