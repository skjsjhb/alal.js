// noinspection JSUnresolvedReference

import Sources from '@/constra/sources.json';
import Strategies from '@/constra/strategies.json';
import { Container } from '@/modules/container/Container';
import { fetchJSON } from '@/modules/net/FetchUtil';
import { resolveRules } from '@/modules/profile/Rules';
import { Argument, AssetIndex, DownloadArtifact, Library, VersionProfile } from '@/modules/profile/VersionProfile';
import { mergeObjects } from '@/modules/util/Objects';
import { OSType } from '@/modules/util/OSType';
import { readJSON } from 'fs-extra';
import os from 'os';

/**
 * Covert a profile to fit the latest format in-place.
 *
 * This method transforms legacy properties, but does not append missing ones
 * (e.g. `javaVersion` and `complianceLevel`).
 *
 * Properties might be assigned with value `undefined` rather than deleted. Avoid using
 * key-based indexing on the upgraded profile.
 * @param src Parsed legacy profile object.
 */
export function normalizeProfile(src: any): void {
    if (src.minecraftArguments) {
        src.arguments = {
            game: convertGameArguments(src.minecraftArguments),
            jvm: createDefaultVMArguments()
        };
        delete src.minecraftArguments;
    }
    if (src.libraries instanceof Array) {
        src.libraries.forEach(convertMavenLibrary);
        const libs = src.libraries;
        src.libraries = [];
        for (const l of libs) {
            src.libraries.push(...mergeClassifiers(l));
        }
    }
}

/**
 * Upgrade a possibly outdated non-inherited Mojang profile to the latest version.
 *
 * In earlier days, profiles do not have `complianceLevel` and `javaVersion` properties. These properties,
 * however, are important for selecting the correct JVM to launch the game. This method retrieves the latest profile
 * with the same ID from Mojang manifests, then copy the two properties mentioned above.
 */
export async function upgradeProfile(src: any): Promise<void> {
    if (typeof src.id == 'string' && (!src.javaVersion || !src.complianceLevel)) {
        console.log('Upgrading profile ' + src.id);
        const manifest = await syncMojangProfileManifest();
        if (!manifest) {
            return;
        }
        const entry = manifest.versions.find((v) => v.id == src.id);
        if (!entry) {
            console.log('Profile ' + src.id + ' is not included in the manifest.');
            return;
        }
        console.log('Fetching latest profile for ' + src.id + ' from ' + entry.url);
        const profileSrc = await fetchJSON(entry.url);
        if (!profileSrc || !profileSrc.javaVersion || !profileSrc.complianceLevel) {
            return;
        }
        src.javaVersion = profileSrc.javaVersion;
        src.complianceLevel = profileSrc.complianceLevel;
        console.log('Upgraded profile ' + src.id);
    }
}

interface MojangProfileManifest {
    latest: {
        release: string;
        snapshot: string;
    };
    versions: {
        id: string;
        type: string;
        url: string;
        time: string;
        releaseTime: string;
        sha1: string;
        complianceLevel: number;
    }[];
}

let mojangManifest: MojangProfileManifest;

/**
 * Retrieves Mojang profile manifest.
 *
 * alal.js uses manifest v2. The URL has been included in `sources.json`.
 */
export async function syncMojangProfileManifest(): Promise<MojangProfileManifest | null> {
    if (!mojangManifest) {
        const obj = await fetchJSON(Sources.mojangProfileManifest);
        if (obj) {
            mojangManifest = obj;
        } else {
            console.error('Invalid response received when retrieving profile manifest.');
        }
    }
    return mojangManifest;
}

/**
 * Gets a Mojang profile with the specified ID.
 */
export async function fetchMojangProfile(id: string): Promise<any> {
    const mm = await syncMojangProfileManifest();
    if (!mm) {
        console.error('Could not retrieve profile manifest.');
        return null;
    }
    const index = mm.versions.find((v) => v.id == id);
    if (!index || !index.url) {
        console.error('No profile with such version: ' + id);
        return null;
    }
    return await fetchJSON(index.url);
}

/**
 * Loads and generates a profile with specified ID.
 */
export async function loadProfile(ct: Container, id: string): Promise<VersionProfile | null> {
    const head = await readJSON(ct.getProfilePath(id));
    const srcs = [head];
    let current = head;
    while (current.inheritsFrom) {
        const dep = await readJSON(ct.getProfilePath(current.inheritsFrom));
        srcs.push(dep);
        current = dep;
    }
    srcs.forEach(normalizeProfile);
    return mergeProfiles(srcs);
}

export function getProfileEffectiveLibraries(p: VersionProfile): Library[] {
    return p.libraries.filter((l) => resolveRules(l.rules)); // Libraries do not contain feature-based rules
}

export function isNativeLibrary(l: Library): boolean {
    return l.name.split(':').length == 4;
}

/**
 * Check if the specified native library should be unpacked.
 */
export function isNativeLibraryAllowed(l: Library): boolean {
    const libName = l.name.split(':')[3]; // Assume already checked
    const arch = os.arch();

    // Caveat for arm devices
    if (libName.includes('x86') && arch != 'ia32') {
        return false;
    }
    if (libName.includes('x64') && arch != 'x64') {
        return false;
    }
    if ((libName.includes('arm') || libName.includes('aarch')) && arch != 'arm64') {
        return false;
    }
    switch (OSType.self()) {
        case OSType.WINDOWS:
            return /windows/i.test(libName) || (/win/i.test(libName) && !/darwin/.test(libName));
        case OSType.LINUX:
            return /linux/i.test(libName);
        case OSType.MACOS:
            return /osx/i.test(libName) || /macos/.test(libName) || /darwin/i.test(libName);
    }
    return true;
}

/**
 * Merge profiles and generate an effective profile.
 * @param src An array of profiles to be loaded.
 */
export function mergeProfiles(src: any[]): VersionProfile | null {
    const root = src.find((o) => !o.inheritsFrom);
    if (!root) {
        console.error('Could not merge profile: No root profile found');
        return null;
    }
    const chain = [];
    while (chain.length < src.length - 1) {
        const dep = src.find((o) => o.inheritsFrom == root.id);
        if (!dep) {
            console.error('Could not merge profile: Broken dep chain');
            return null;
        }
        chain.push(dep);
    }
    while (chain.length > 0) {
        mergeProfileFrom(root, chain.pop());
    }
    return root; // TODO validate profile
}

/**
 * Checks if the passed name is a name of legacy index. (i.e. Could not be shared)
 */
export function isLegacyAssetName(name: string): boolean {
    return new RegExp(Strategies.installer.legacyAssets).test(name);
}

/**
 * Loads asset index file for given profile.
 */
export async function loadAssetIndex(ct: Container, prof: VersionProfile): Promise<AssetIndex> {
    return await readJSON(ct.getAssetIndexPath(prof.assetIndex.id));
}

/**
 * Check if the given profile has log config.
 */
export function hasLogConfig(prof: VersionProfile): boolean {
    return !!prof.logging?.client?.file?.id;
}

// Merge 'head' into 'base' in-place.
function mergeProfileFrom(base: any, head: any) {
    if (!head.inheritsFrom == base.id) {
        console.warn('Warning: merging independent profiles: ' + base.id + ' <- ' + head.id);
    }

    // Arguments are appended
    base.arguments = {
        game: [...(base.arguments?.game ?? []), ...(head.arguments?.game ?? [])],
        jvm: [...(base.arguments?.jvm ?? []), ...(head.arguments?.jvm ?? [])]
    };

    // Replace main class
    base.mainClass = head.mainClass || base.mainClass;

    // Merge logging
    mergeObjects(base.logging, head.logging);

    // Libraries are prepended
    if (head.libraries) {
        base.libraries = [...head.libraries, ...base.libraries];
    }

    // Origin IDs
    base.origin = head.origin || head.id;

    // Profile IDs are not merged - this is worked as intended or profiles depending on `version_name` won't work.
}

// Merge classifiers and generate libraries with new id.
// In previous versions, files of different natives are listed in the same library. We'll have to
// split them and generate seperated configurations.
function mergeClassifiers(src: any): Library[] {
    if (!(src?.downloads?.classifiers instanceof Object)) {
        return [src];
    }
    const generatedLibs: Library[] = [];
    if (src.downloads.artifact) {
        // Generate platform-independent library first
        generatedLibs.push({
            name: src.name,
            rules: src.rules,
            downloads: {
                artifact: src.downloads.artifact
            }
        });
    }
    const classifiers = Object.entries(src.downloads.classifiers);
    for (const [clazz, artifact] of classifiers) {
        generatedLibs.push({
            name: src.name + ':' + clazz,
            rules: src.rules,
            downloads: {
                artifact: artifact as DownloadArtifact
            }
        });
    }
    console.log(`Merged classifiers for ${src.name} (${classifiers.length} natives)`);
    return generatedLibs;
}

// Legacy launchers only uses a single space-split string to store the args.
// This method converts them.
function convertGameArguments(minecraftArguments: string): Argument[] {
    const args = minecraftArguments.split(' ');
    console.log(`Converted game arguments (${args.length} args)`);
    return args;
}

// Creates default args for legacy profiles
function createDefaultVMArguments(): Argument[] {
    console.log('Generating default arguments for VM.');
    return Strategies.vmArgs as Argument[];
}

// Convert libraries with only `name` and `url`
function convertMavenLibrary(src: any) {
    if (!src.name || !src.url) {
        return;
    }
    const [group, artifact, version] = src.name.split(':');
    if (!group || !artifact || !version) {
        return;
    }
    const path = group.replaceAll('.', '/') + '/' + artifact + '/' + version + '/' + artifact + '-' + version + '.jar';
    src.downloads = {
        artifact: {
            path,
            url: src.url + path,
            sha1: '',
            size: -1
        }
    };
    delete src.url;
}
