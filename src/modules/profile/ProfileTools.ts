// noinspection JSUnresolvedReference

import Defaults from "@/constra/defaults.json";
import Sources from "@/constra/sources.json";
import { fetchJSON } from "@/modules/net/FetchUtil";
import { Argument, DownloadArtifact, Library } from "@/modules/profile/VersionProfile";

export namespace ProfileTools {
    /**
     * Covert a legacy profile to fit the latest format in-place.
     *
     * This method transforms legacy properties, but does not append missing ones
     * (e.g. `javaVersion` and `complianceLevel`).
     *
     * Properties might be assigned with value `undefined` rather than deleted. Avoid using
     * key-based indexing on the upgraded profile.
     * @param src Parsed legacy profile object.
     */
    export function covertLegacyProfile(src: any): void {
        if (src.minecraftArguments) {
            src.arguments = {
                game: convertGameArguments(src.minecraftArguments),
                jvm: createDefaultVMArguments()
            };
            delete src.minecraftArguments;
        }
        if (src.libraries instanceof Array) {
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
        if (typeof src.id == "string" && (!src.javaVersion || !src.complianceLevel)) {
            console.log("Upgrading profile " + src.id);
            const manifest = await getMojangManifest();
            if (!manifest) {
                return;
            }
            const entry = manifest.versions.find((v) => v.id == src.id);
            if (!entry) {
                console.log("Profile " + src.id + " is not included in the manifest.");
                return;
            }
            console.log("Fetching latest profile for " + src.id + " from " + entry.url);
            const profileSrc = await fetchJSON(entry.url);
            if (!profileSrc || !profileSrc.javaVersion || !profileSrc.complianceLevel) {
                return;
            }
            src.javaVersion = profileSrc.javaVersion;
            src.complianceLevel = profileSrc.complianceLevel;
            console.log("Upgraded profile " + src.id);
        }
    }

    interface MojangProfileManifest {
        latest: {
            release: string,
            snapshot: string
        };
        versions: {
            id: string,
            type: string,
            url: string,
            time: string,
            releaseTime: string,
            sha1: string,
            complianceLevel: number,
        }[];
    }

    let mojangManifest: MojangProfileManifest;

    /**
     * Retrieves Mojang profile manifest.
     *
     * ALAL uses manifest v2. The URL has been included in `sources.json`.
     */
    export async function getMojangManifest(): Promise<MojangProfileManifest | null> {
        if (!mojangManifest) {
            const obj = await fetchJSON(Sources.mojangProfileManifest);
            if (obj) {
                mojangManifest = obj;
            } else {
                console.error("Invalid response received when retrieving profile manifest.");
            }
        }
        return mojangManifest;
    }

    /**
     * Gets a Mojang profile with the specified ID.
     */
    export async function getMojangProfile(id: string): Promise<any> {
        const mm = await getMojangManifest();
        if (!mm) {
            console.error("Could not retrieve profile manifest.");
            return null;
        }
        return mm.versions.find((v) => v.id == id);
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
                name: src.name + ":" + clazz,
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
        const args = minecraftArguments.split(" ");
        console.log(`Converted game arguments (${args.length} args)`);
        return args;
    }

    // Creates default args for legacy profiles
    function createDefaultVMArguments(): Argument[] {
        console.log("Generating default arguments for VM.");
        return Defaults.vmArgs as Argument[];
    }
}