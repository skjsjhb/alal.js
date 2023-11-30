import { Paths } from "@/modules/data/Paths";
import { ProfileTools } from "@/modules/profile/ProfileTools";
import { AssetIndex } from "@/modules/profile/VersionProfile";
import path from "path";

export interface Container {
    /**
     * Root directory.
     */
    rootDir: string;

    /**
     * Containers created from modpacks or imported will be locked to protect the integrity. Changing them might cause
     * problems. This can be unlocked manually by user.
     */
    locked: boolean;

    /**
     * Enable support for isolated profiles.
     */
    isolated: boolean;

    /**
     * Enable shared container support. In these containers, assets and libraries are not installed, but
     * are linked to files in the data root of alal.js.
     *
     * - Libraries: `<root>/maven`
     * - Assets: `<root>/sharedAssets`
     *
     * As far as we know, Forge and NeoForged cannot be installed on shared containers due to conflicts
     * with library files. They are disabled on the installation page.
     */
    shared: boolean;
}

export namespace ContainerTools {
    /**
     * Gets the path to the profile.
     */
    export function getProfilePath(c: Container, id: string): string {
        // Profile paths are constant
        return path.join(c.rootDir, "versions", id, id + ".json");
    }

    /**
     * Gets the path to the client.
     *
     * Note that client file might not exist if there is no `downloads.client` key.
     */
    export function getClientPath(c: Container, id: string): string {
        return path.join(c.rootDir, "versions", id, id + ".jar");
    }

    export function getNativesDirectory(c: Container, id: string): string {
        return path.join(c.rootDir, "versions", id, "natives");
    }

    /**
     * Gets the path to the asset file of this container. i.e. Shared path is returned for shared containers, and
     * dedicated containers resolve their own paths. Automatically resolves legacy and resource-mapped assets.
     */
    export function getAssetPath(c: Container, id: string, a: AssetIndex, fileName: string, hash: string): string {
        if (a.map_to_resources) {
            return getMappedAssetPath(c, fileName);
        }
        if (ProfileTools.isLegacyAssets(id)) {
            return getLegacyAssetPath(c, fileName);
        }
        if (c.shared) {
            return getGlobalAssetPath(hash);
        } else {
            return getLocalAssetPath(c, hash);
        }
    }

    /**
     * Gets the path to this asset index. Automatically resolves for legacy assets.
     * This method returns an array since under some scenarios asset index file must be saved
     * to multiple locations.
     */
    export function getAssetIndexInstallPaths(c: Container, id: string, a: AssetIndex): string[] {
        const dedicatedPath = getLocalAssetIndexPath(c, id);
        const sharedPath = getGlobalAssetIndexPath(id);
        if (a.map_to_resources) {
            // The mapped files cannot be shared. We left a copy for indexing.
            return [path.join(c.rootDir, "resources", id + ".json"), c.shared ? sharedPath : dedicatedPath];
        } else {
            if (!ProfileTools.isLegacyAssets(id) && c.shared) {
                return [sharedPath];
            } else {
                return [dedicatedPath];
            }
        }
    }

    /**
     * Similar to {@link getAssetIndexInstallPaths}, except that this method resolves to the dedicated copy only.
     */
    export function getAssetIndexPath(ct: Container, aid: string): string {
        return ct.shared ? getGlobalAssetIndexPath(aid) : getLocalAssetIndexPath(ct, aid);
    }

    /**
     * Gets the path to log config.
     */
    export function getLogConfigPath(ct: Container, id: string): string {
        return path.join(ct.rootDir, id); // This file is rather small
    }

    function getLocalAssetIndexPath(c: Container, aid: string): string {
        return path.join(c.rootDir, "assets", "indexes", aid + ".json");
    }

    function getGlobalAssetIndexPath(aid: string): string {
        return Paths.getDataPath("sharedAssets", "assets", "indexes", aid + ".json");
    }

    function getLegacyAssetPath(c: Container, fileName: string): string {
        return path.join(c.rootDir, "assets", "virtual", "legacy", fileName);
    }

    // For 1.5.2 or earlier
    function getMappedAssetPath(c: Container, fileName: string): string {
        return path.join(c.rootDir, "resources", fileName);
    }

    /**
     * Gets the path to the library file of this container. i.e. Shared path is returned for shared containers, and
     * dedicated containers resolve their own paths.
     */
    export function getLibraryPath(c: Container, p: string): string {
        if (c.shared) {
            return getGlobalLibraryPath(p);
        } else {
            return getLocalLibraryPath(c, p);
        }
    }

    function getLocalAssetPath(c: Container, hash: string): string {
        return path.join(c.rootDir, "assets", "objects", hash.slice(0, 2), hash);
    }

    function getGlobalAssetPath(hash: string): string {
        return Paths.getDataPath("sharedAssets", "assets", "objects", hash.slice(0, 2), hash);
    }

    function getLocalLibraryPath(c: Container, p: string): string {
        return path.join(c.rootDir, "libraries", p);
    }

    function getGlobalLibraryPath(p: string): string {
        return Paths.getDataPath("maven", p);
    }


}