// noinspection JSUnresolvedReference

import Defaults from "@/constra/defaults.json";

const PDRules = Defaults.profileDetection;

/**
 * ALAL supports multiple variants of profiles. These profiles vary by their structures, version string formatting
 * and libraries. This module detected specific information about a profile.
 */
export namespace ProfileDetector {
    /**
     * Check if the specified profile is a Mojang profile.
     *
     * This method only returns `true` for a profile unlikely to have been modified. We know some launchers
     * are modifying or merging the profiles, for these profiles this method will return `false`.
     * @param src Parsed profile source.
     */
    export function isMojang(src: any): boolean {
        if (!src?.minimumLauncherVersion) {
            return false;
        }
        if (src?.javaVersion) {
            return true;
        }
        if (!src?.assets || !src?.assetIndex) {
            return false;
        }
        if (src?.downloads?.client_mappings) {
            return true;
        }
        if (checkLibraries(src, PDRules.libraries.mojang)) {
            return true;
        }
        if (PDRules.mainClasses.mojang.includes(src?.mainClass)) {
            return true;
        }
        // Forge
        if (src?._comment_) {
            return false;
        }
        // Most likely to be a mod loader
        if (src?.inheritsFrom) {
            return false;
        }
        // Fallback, for unknown profiles, regard as non-mojang
        return false;
    }

    // Checks the library presence or absence.
    // In the rules file, libraries start with a dash indicates that this library should NOT present.
    function checkLibraries(src: any, libs: string[]): boolean {
        const results = [];
        for (let lib of libs) {
            const reverse = lib.startsWith("-");
            if (reverse) {
                lib = lib.substring(1);
            }
            if (!src?.libraries || !(src.libraries instanceof Array)) {
                results.push(reverse);
            }
            for (const library of src?.libraries) {
                if (library?.name?.includes(lib)) {
                    results.push(!reverse);
                }
            }
            results.push(reverse);
        }
        return results.every(r => r);
    }
}