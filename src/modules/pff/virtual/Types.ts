/**
 * This module is deprecated.
 * @deprecated
 */


export interface ExtraAddonInfo extends AddonInfo {
    type: "MODPACK" | "MOD";
    url: string;
}

export interface AddonInfo {
    id: number; // Sorry, but id cannot work now, we should use slug. In future, id will always be 0.
    name: string;
    websiteUrl: string;
    slug: string;
    gameVersionLatestFiles: GameVersionFilesIndex[];
    defaultFileId: number;
    thumbNail: string;
}

export interface File {
    id: number;
    displayName: string;
    fileName: string;
    fileDate: string;
    fileLength: number;
    // dependencies: Dependency[];
    gameVersion: string[];
    downloadUrl: string;
}

interface GameVersionFilesIndex {
    gameVersion: string;
    projectFileId: number;
    modLoader: number;
}

