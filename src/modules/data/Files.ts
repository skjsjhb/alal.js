import { createHash } from "crypto";
import { access, createReadStream } from "fs-extra";
import { pipeline } from "stream/promises";

/**
 * Misc file functions.
 */
export module Files {
    /**
     * Check the integrity of the specified file.
     */
    export async function checkIntegrity(file: string, hash: string, type: string): Promise<boolean> {
        try {
            return (await hashFile(file, type)) == hash.toLowerCase();
        } catch (e) {
            console.error("Failed to validate hash for " + file + ": " + e);
            return false;
        }
    }

    /**
     * Calculates the hash of a given file using specified algorithm. Returns the result as lowercase hex string.
     */
    export async function hashFile(file: string, type: string): Promise<string> {
        const hashed = createHash(type);
        await pipeline(createReadStream(file), hashed);
        return hashed.digest("hex").toLowerCase();
    }


    /**
     * Checks if a file exists. Can be used as an alternative to `fs.exists()`.
     */
    export async function exists(loc: string): Promise<boolean> {
        try {
            await access(loc);
            return true;
        } catch {
            return false;
        }
    }
}