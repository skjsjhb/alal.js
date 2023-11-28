import { Paths } from "@/modules/data/Paths";
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
     * are linked to files in the data root of ALAL.
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
     * dedicated containers resolve their own paths.
     */
    export function getAssetPath(c: Container, hash: string): string {
        if (c.shared) {
            return getGlobalAssetPath(hash);
        } else {
            return getLocalAssetPath(c, hash);
        }
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