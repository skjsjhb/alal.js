/**
 * Entry point of the new renderer.
 */
import { ReInit } from "./reinit/ReInit";

async function main() {
    await ReInit.initRenderer();
}

void main();