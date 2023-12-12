// noinspection JSUnresolvedReference

import Strategies from '@/constra/strategies.json';
import MojangVersions from '@/constra/version-names.json';

/**
 * alal.js supports multiple variants of profiles. These profiles vary by their structures, version string formatting
 * and libraries. This module detected specific information about a profile.
 */
const PDRules = Strategies.profileDetection;

/**
 * Check if the specified profile is a Mojang profile.
 *
 * This method returns `true` if the profile is a superset of a Mojang profile. Some launchers are
 * merging profiles and due to this, even if this method returns `false`, it does not indicate that this
 * file is the same as the original profile.
 * @param src Parsed profile source.
 */
export function isMojangProfile(src: any): boolean {
    return (
        !!src &&
        !!src.minimumLauncherVersion &&
        !!src.assets &&
        !!src.assetIndex &&
        !!src.downloads.client &&
        !src.inheritsFrom &&
        !isModLoaderProfile(src) &&
        checkLibraries(src, PDRules.libraries.mojang)
    );
}

function isModLoaderProfile(src: any): boolean {
    return (
        isForgeProfile(src) ||
        isFabricProfile(src) ||
        isQuiltProfile(src) ||
        isLiteLoaderProfile(src) ||
        isOptiFineProfile(src)
    );
}

// Checks for modloaders are not strict as Mojang versions.

export function isForgeProfile(src: any): boolean {
    return !isNeoForgedProfile(src) && checkLibraries(src, PDRules.libraries.forge);
}

export function isNeoForgedProfile(src: any): boolean {
    return checkLibraries(src, PDRules.libraries.neoforged);
}

export function isFabricProfile(src: any): boolean {
    return !isQuiltProfile(src) && checkLibraries(src, PDRules.libraries.fabric);
}

export function isQuiltProfile(src: any): boolean {
    return checkLibraries(src, PDRules.libraries.quilt);
}

export function isLiteLoaderProfile(src: any): boolean {
    return checkLibraries(src, PDRules.libraries.liteloader);
}

export function isOptiFineProfile(src: any): boolean {
    return checkLibraries(src, PDRules.libraries.optifine);
}

/**
 * Checks if the passed id is likely a Mojang version name.
 *
 * This method uses a list of known Mojang versions to check and then the regex.
 * If the file is outdated the data might be incorrect. A Mojang version name always passes the test, while
 * it's not true in reverse.
 */
export function isMojangVersionId(id: string): boolean {
    return MojangVersions.includes(id) || !!PDRules.versionRegex.find((r) => new RegExp(r).test(id));
}

// Compatibility with patched profiles (https://github.com/skjsjhb/alal.js/issues/6)
function getVersionByPatches(src: any): string {
    if (src.patches instanceof Array) {
        for (const patch of src.patches) {
            if (patch.id == 'game' && patch.version && isMojangVersionId(patch.version)) {
                return patch.version;
            }
        }
    }
    return '';
}

/**
 * Retrieves the game version (i.e. version of the original client) from the profile.
 *
 * This method returns the most likely result. If it failed to find one, an empty string is returned.
 */
export function getGameVersion(profiles: any[]): string {
    let v: string;

    // First handle special cases
    for (const p of profiles) {
        if ((v = getVersionByPatches(p))) return v;
    }

    // Analyze the inherit chain
    const root = findRootProfile(profiles);
    if (root && isMojangVersionId(root.id)) {
        return root.id;
    }

    // Directly check all profiles
    for (const prof of profiles) {
        if (isMojangVersionId(prof.id)) {
            return prof.id;
        }
    }

    // Extract any
    for (const { id } of profiles) {
        if ((v = extractMojangVersion(id))) return v;
    }

    // Cannot decide
    return '';
}

function findRootProfile(profiles: any[]): any {
    for (const prof of profiles) {
        if (!prof.inheritsFrom) {
            // A valid chain only has one element without the field
            return prof;
        }
    }
    return null;
}

// Uses regex to extract mojang version name
function extractMojangVersion(src: string): string {
    for (const r of PDRules.versionRegex) {
        const m = src.match(new RegExp(r));
        if (m) {
            return m[0];
        }
    }
    return '';
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
