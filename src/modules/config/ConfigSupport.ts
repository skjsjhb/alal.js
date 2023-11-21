import path from "path";
import { getOSSpecificDataDir } from "./OSDirSupport";
import { getBasePath } from "./PathSolve";

const CONFIG_FILE = path.resolve(getOSSpecificDataDir(), "alicorn.config.json");

const DEFAULT_CONFIG_FILE = path.resolve(
    getBasePath(),
    "defaults",
    "alicorn.config.json"
);

let cachedConfig = {};


/**
 * @deprecated
 */
export function set(key: string, value: unknown): void {
    throw "Not implemented";
}

/**
 * @deprecated
 */

export function get(key: string, def: unknown): unknown {
    throw "Not implemented";
}


/**
 * @deprecated
 */

export function getBoolean(key: string, def = false): boolean {
    throw "Not implemented";
}

/**
 * @deprecated
 */
export function getString(key: string, def = "", nonEmpty = false): string {
    throw "Not implemented";
}


/**
 * @deprecated
 */
export function getNumber(key: string, def = 0): number {
    throw "Not implemented";
}

export async function loadConfig(): Promise<void> {
    throw "Not implemented";
}

