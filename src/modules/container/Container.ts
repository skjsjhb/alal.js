import { getRuntimeDataPath } from '@/modules/data/Paths';
import { isLegacyAssetName } from '@/modules/profile/ProfileTools';
import { AssetIndex } from '@/modules/profile/VersionProfile';
import path from 'path';

export class Container {
    /**
     * Container name.
     */
    id: string;

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

    constructor(o: { id: string; rootDir: string; locked: boolean; isolated: boolean; shared: boolean }) {
        this.id = o.id;
        this.rootDir = o.rootDir;
        this.locked = o.locked;
        this.isolated = o.isolated;
        this.shared = o.shared;
    }

    /**
     * Gets the path to the profile.
     */
    getProfilePath(id: string): string {
        return path.join(this.rootDir, 'versions', id, id + '.json');
    }

    /**
     * Gets the runtime root directory (aka. `--rootDir`) for the given profile. With isolation support.
     */
    getRuntimeRoot(id: string): string {
        if (this.isolated) {
            return path.join(this.rootDir, 'versions', id);
        } else {
            return this.rootDir;
        }
    }

    /**
     * Gets the path to the client.
     *
     * Note that client file might not exist if there is no `downloads.client` key.
     */
    getClientPath(id: string): string {
        return path.join(this.rootDir, 'versions', id, id + '.jar');
    }

    getNativesDirectory(id: string): string {
        return path.join(this.rootDir, 'versions', id, 'natives');
    }

    /**
     * Gets the path to the asset file of this container. i.e. Shared path is returned for shared containers, and
     * dedicated containers resolve their own paths. Automatically resolves legacy and resource-mapped assets.
     */
    getAssetPath(id: string, a: AssetIndex, fileName: string, hash: string): string {
        if (a.map_to_resources) {
            return this.getMappedAssetPath(fileName);
        }
        if (isLegacyAssetName(id)) {
            return this.getLegacyAssetPath(fileName);
        }
        if (this.shared) {
            return getGlobalAssetPath(hash);
        } else {
            return this.getLocalAssetPath(hash);
        }
    }

    /**
     * Gets the path to the library file of this container. i.e. Shared path is returned for shared containers, and
     * dedicated containers resolve their own paths.
     */
    getLibraryPath(p: string): string {
        if (this.shared) {
            return getGlobalLibraryPath(p);
        } else {
            return this.getLocalLibraryPath(p);
        }
    }

    /**
     * Gets the paths to this asset index. Automatically resolves for legacy assets.
     * This method returns an array since under some scenarios asset index file must be saved
     * to multiple locations.
     */
    getAssetIndexInstallPaths(id: string, a: AssetIndex): string[] {
        const dedicatedPath = this.getLocalAssetIndexPath(id);
        const sharedPath = getGlobalAssetIndexPath(id);
        if (a.map_to_resources) {
            // The mapped files cannot be shared. We left a copy for indexing.
            return [path.join(this.rootDir, 'resources', id + '.json'), this.shared ? sharedPath : dedicatedPath];
        } else {
            if (!isLegacyAssetName(id) && this.shared) {
                return [sharedPath];
            } else {
                return [dedicatedPath];
            }
        }
    }

    /**
     * Gets the path to log config.
     */
    getLogConfigPath(id: string): string {
        return path.join(this.rootDir, id); // This file is rather small
    }

    /**
     * Similar to {@link getAssetIndexInstallPaths}, except that this method resolves to the dedicated copy only.
     */
    getAssetIndexPath(aid: string): string {
        return this.shared ? getGlobalAssetIndexPath(aid) : this.getLocalAssetIndexPath(aid);
    }

    protected getLocalAssetIndexPath(aid: string): string {
        return path.join(this.rootDir, 'assets', 'indexes', aid + '.json');
    }

    protected getLocalAssetPath(hash: string): string {
        return path.join(this.rootDir, 'assets', 'objects', hash.slice(0, 2), hash);
    }

    protected getLocalLibraryPath(p: string): string {
        return path.join(this.rootDir, 'libraries', p);
    }

    protected getLegacyAssetPath(fileName: string): string {
        return path.join(this.rootDir, 'assets', 'virtual', 'legacy', fileName);
    }

    // For 1.5.2 or earlier
    protected getMappedAssetPath(fileName: string): string {
        return path.join(this.rootDir, 'resources', fileName);
    }
}

const sharedAssetsRoot = 'sharedAssets';

function getGlobalAssetIndexPath(aid: string): string {
    return getRuntimeDataPath(sharedAssetsRoot, 'assets', 'indexes', aid + '.json');
}

function getGlobalAssetPath(hash: string): string {
    return getRuntimeDataPath(sharedAssetsRoot, 'assets', 'objects', hash.slice(0, 2), hash);
}

function getGlobalLibraryPath(p: string): string {
    return getRuntimeDataPath('maven', p);
}
