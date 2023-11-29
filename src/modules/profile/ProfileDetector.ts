// noinspection JSUnresolvedReference

import Strategies from "@/constra/strategies.json";

const PDRules = Strategies.profileDetection;

/**
 * alal.js supports multiple variants of profiles. These profiles vary by their structures, version string formatting
 * and libraries. This module detected specific information about a profile.
 */
export namespace ProfileDetector {
    /**
     * Check if the specified profile is a Mojang profile.
     *
     * This method returns `true` if the profile is a superset of a Mojang profile. Some launchers are
     * merging profiles and due to this, even if this method returns `false`, it does not indicate that this
     * file is the same as the original profile.
     * @param src Parsed profile source.
     */
    export function isMojang(src: any): boolean {
        if (!src?.minimumLauncherVersion) {
            return false;
        }
        if (!src?.assets || !src?.assetIndex) {
            return false;
        }
        if (!src?.downloads?.client) {
            return false;
        }
        if (src?.inheritsFrom) {
            return false;
        }
        if (isModLoader(src)) {
            return false;
        }
        return checkLibraries(src, PDRules.libraries.mojang);
    }

    function isModLoader(src: any): boolean {
        return isForge(src) || isFabric(src) || isQuilt(src) || isLiteLoader(src) || isOptiFine(src);
    }

    // Checks for modloaders are not strict as Mojang versions.

    export function isForge(src: any): boolean {
        return !isNeoForged(src) && checkLibraries(src, PDRules.libraries.forge);
    }

    export function isNeoForged(src: any): boolean {
        return checkLibraries(src, PDRules.libraries.neoforged);
    }

    export function isFabric(src: any): boolean {
        return !isQuilt(src) && checkLibraries(src, PDRules.libraries.fabric);
    }

    export function isQuilt(src: any): boolean {
        return checkLibraries(src, PDRules.libraries.quilt);
    }

    export function isLiteLoader(src: any): boolean {
        return checkLibraries(src, PDRules.libraries.liteloader);
    }

    export function isOptiFine(src: any): boolean {
        return checkLibraries(src, PDRules.libraries.optifine);
    }

    /**
     * Checks if the passed id is likely to contains a Mojang version.
     *
     * When we say 'likely', we mean that this method uses RegExp and might not be 100% correct.
     */
    export function isLikelyMojangVersion(id: string): boolean {
        const regexSet = PDRules.versionRegex;
        for (let r of regexSet) {
            if (new RegExp("^" + r + "$").test(id)) {
                return true;
            }
        }
        return false;
    }

    // Compatibility with patched profiles (https://github.com/skjsjhb/alal.js/issues/6)
    function getVersionByPatches(src: any): string {
        if (src.patches instanceof Array) {
            for (const patch of src.patches) {
                if (patch.id == "game" && patch.version && isLikelyMojangVersion(patch.version)) {
                    return patch.version;
                }
            }
        }
        return "";
    }

    /**
     * Retrieves the game version (i.e. version of the original client) from the profile.
     *
     * This method returns the most likely result. If it failed to find one, an empty string is returned.
     */
    export function getGameVersion(profiles: any[]): string {
        // First handle special cases
        for (const p of profiles) {
            const vp = getVersionByPatches(p);
            if (vp) {
                return vp;
            }
        }

        // Analyze the inherit chain
        for (const prof of profiles) {
            let current = prof;
            while (typeof current.inheritsFrom == "string") {
                current = profiles.find((p) => p.id == current.inheritsFrom);
                if (!current) {
                    break;
                }
            }
            if (current && isMojang(current) && isLikelyMojangVersion(current.id)) {
                return current.id;
            }
        }

        // Directly check all profiles
        for (const prof of profiles) {
            if (isMojang(prof)) {
                if (isLikelyMojangVersion(prof.id)) {
                    return prof.id;
                } else {
                    // Extract the most likely one
                    const ev = extractMojangVersion(prof.id);
                    if (ev) {
                        return ev;
                    }
                }
            }
        }

        // Extract any
        for (const {id} of profiles) {
            const ev = extractMojangVersion(id);
            if (ev) {
                return ev;
            }
        }
        return ""; // I don't know
    }

    function extractMojangVersion(src: string): string {
        for (let r of PDRules.versionRegex) {
            const m = src.match(new RegExp(r));
            if (m) {
                return m[0];
            }
        }
        return "";
    }

    // Checks the library presence or absence.
    // In the rules file, libraries start with a dash (e.g. `-net.fabricmc`) indicates that this library
    // should NOT present.
    function checkLibraries(src: any, libs: string[]): boolean {
        if (!(src.libraries instanceof Array)) {
            return false;
        }
        const profileLibs = src.libraries.map((l: any) => String(l.name));

        for (const l of libs) {
            for (const p of profileLibs) {
                if (p.includes(l)) {
                    return true;
                }
            }
        }
        return false;
    }
}