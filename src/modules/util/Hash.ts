import { createHash } from "crypto";

/**
 * Generic hash module.
 */
export module Hash {

    /**
     * Create the hash of a string using specified algorithm. Returns in lowercase hex format.
     */
    export function hashString(str: string, algo = "sha256"): string {
        try {
            const hashed = createHash(algo);
            hashed.update(str);
            return hashed.digest("hex").toLowerCase();
        } catch (e) {
            console.error("Error during hash: " + e);
            return "";
        }
    }
}