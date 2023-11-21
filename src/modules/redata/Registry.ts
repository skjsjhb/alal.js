import { Paths } from "@/modules/redata/Paths";
import { ensureDir, outputJSON, readJSON } from "fs-extra";
import path from "path";

/**
 * All-in-one user preferences and runtime data storage module.
 *
 * Registry only stores objects which can be serialized into JSON format. Other properties are discarded.
 */
export namespace Registry {
    // Table map for all entries
    let regTables = new Map<string, any>();
    let registryRoot = "reg";

    /**
     * Load all tables from disk.
     */
    export async function loadTables(): Promise<void> {
        const rootDir = Paths.getDataPath(registryRoot);
        await ensureDir(rootDir); // When running for the first time

        console.log("Loading registry tables.");
        const dirs = await Paths.scanDir(rootDir, true);
        await Promise.all(dirs.map(loadOneTable));
    }

    /**
     * Save all tables to disk.
     */
    export async function saveTables(): Promise<void> {
        console.log("Saving registry tables.");

        const promos = [];
        for (const [k, t] of regTables.entries()) {
            const targetPath = Paths.getDataPath(path.join(registryRoot, k + ".json"));
            promos.push(outputJSON(targetPath, t));
        }
        await Promise.all(promos);
    }

    /**
     * Gets the specified table and convert it to specified type.
     * Type cast is not checked - maintaining serialization stability between modifications are important.
     */
    export function getTableRaw<T>(name: string): T | undefined {
        return regTables.get(name);
    }

    /**
     * Variant of {@link getTableRaw}, with a default value set.
     */
    export function getTable<T>(name: string, def: T): T {
        if (!regTables.has(name)) {
            regTables.set(name, def);
        }
        return regTables.get(name);
    }

    // Loads a single table from file
    async function loadOneTable(absPath: string): Promise<void> {
        const name = path.basename(absPath, path.extname(absPath));
        try {
            console.log("Loading registry table " + name);
            regTables.set(name, await readJSON(absPath));
        } catch (e) {
            console.error("Could not load table " + name + ": " + e);
        }
    }
}