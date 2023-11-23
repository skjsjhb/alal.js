import Keyring from "@/constra/keyring.json";
import { Paths } from "@/modules/redata/Paths";
import { access, copyFile, ensureDir } from "fs-extra";
import path from "path";
import * as uuid from "uuid";

/**
 * File cache module.
 */
export namespace Cacher {
    let cacheRoot: string;
    let cacheUUID = Keyring.uuid.cache;

    /**
     * Gets the root directory and ensures its existence.
     */
    export async function configure(): Promise<void> {
        try {
            console.log("Configuring cache module.");
            cacheRoot = Paths.getDataPath("cache");
            await ensureDir(cacheRoot);
        } catch (e) {
            console.error("Error during configuring cache: " + e);
        }
    }

    // Gets the uuid of the specified key
    function getUUID(key: string): string {
        return uuid.v5(key, cacheUUID);
    }

    /**
     * Add a file to cache using the specified key.
     * @param key Unique key.
     * @param source File path.
     */
    export async function addCache(key: string, source: string): Promise<void> {
        try {
            const dest = path.join(cacheRoot, getUUID(key));
            await copyFile(source, dest);
        } catch (e) {
            console.error("Could not append cache: " + e);
        }
    }

    /**
     * Tries to apply specified cache to the destination. Returns `true` if the cache is applied, `false` if either
     * the cache file is not found or I/O error occurred.
     * @param key Unique key of the cache to be used.
     * @param dest Target location.
     */
    export async function applyCache(key: string, dest: string): Promise<boolean> {
        const src = path.join(cacheRoot, getUUID(key));
        try {
            await access(src);
        } catch {
            return false; // File does not exist
        }
        try {
            await copyFile(src, dest);
            return true;
        } catch (e) {
            // This is not expected
            console.error("Error during applying cache: " + e);
            return false;
        }
    }
}