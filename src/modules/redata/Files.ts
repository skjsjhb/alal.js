import { createHash } from "crypto";
import { createReadStream } from "fs-extra";
import { pipeline } from "stream/promises";

/**
 * Misc file functions.
 */
export namespace Files {
    /**
     * Check the integrity of the specified file.
     *
     * @param file Path to the file for validation.
     * @param hash Hash data as string.
     * @param type Hash type.
     */
    export async function checkIntegrity(file: string, hash: string, type: string): Promise<boolean> {
        try {
            const hashed = createHash(type);
            await pipeline(createReadStream(file), hashed);
            const result = hashed.digest("hex");
            return result.toLowerCase() == hash.toLowerCase();
        } catch (e) {
            console.error("Failed to validate hash for " + file + ": " + e);
            return false;
        }
    }
}