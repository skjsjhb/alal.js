import { getNumber } from "../../config/ConfigSupport";
import { AddonInfo, File } from "./Types";
import {
    findCompatibleArtifact,
    getModMetaBySlug,
    getVersionListForMod,
    lookupModMetaInfo,
    searchMetaBySlug
} from "../modrinth/Get";
import { addToLockfile, Lockfile2 } from "./Lockfile";
import { ModArtifact, ModMeta } from "./ModDefine";

// One resolver is for one mod slug
export interface ModResolver {
    mainId: string | undefined; // Selected, like dpkg
    artifactId: string | undefined; // Selected
    resolveMod(): Promise<ModMeta>;

    searchMods(num: number): Promise<ModMeta[]>;

    getArtifactFor(
        gameVersion: string,
        modLoader: ModLoaderType
    ): Promise<ModArtifact>;

    canSupport(gameVersion: string, modLoader: ModLoaderType): Promise<boolean>;

    setSelected(
        mainId: string | undefined,
        artifactId: string | undefined
    ): Promise<void>;

    writeLock(lockfile: Lockfile2): Promise<void>;

    clearCached(): Promise<void>;
}

export abstract class AbstractModResolver implements ModResolver {
    public mainId: string | undefined; // Selected, like dpkg
    public artifactId: string | undefined; // Selected
    public slug: string;
    public cachedMeta: ModMeta | undefined;
    public cachedArtifact: ModArtifact | undefined;

    public constructor(slug: string) {
        this.slug = slug;
    }

    writeLock(lockfile: Lockfile2): Promise<void> {
        if (!this.cachedMeta || !this.cachedArtifact) {
            throw "Must resolve first!";
        }
        addToLockfile(lockfile, this.cachedMeta, this.cachedArtifact);
        return Promise.resolve();
    }

    abstract resolveMod(): Promise<ModMeta>;

    abstract searchMods(num: number): Promise<ModMeta[]>;

    abstract getArtifactFor(
        gameVersion: string,
        modLoader: ModLoaderType
    ): Promise<ModArtifact>;

    abstract canSupport(
        gameVersion: string,
        modLoader: ModLoaderType
    ): Promise<boolean>;

    abstract setSelected(
        mainId: string | undefined,
        artifactId: string | undefined
    ): Promise<void>;

    abstract clearCached(): Promise<void>;
}

// Due to #85, we have to make a change to pff, we now use the slug directly as id

export class ModrinthModResolver extends AbstractModResolver {
    protected static MR_BASE_URL = "https://api.modrinth.com";
    protected insideCachedArtifactList: ModArtifact[] | undefined;

    async resolveMod(): Promise<ModMeta> {
        if (this.cachedMeta) {
            return this.cachedMeta;
        }
        let b: ModMeta | undefined;
        if (this.mainId) {
            b = await lookupModMetaInfo(
                this.mainId,
                ModrinthModResolver.MR_BASE_URL,
                getNumber("download.pff.timeout")
            );
        } else {
            b = await getModMetaBySlug(
                this.slug,
                ModrinthModResolver.MR_BASE_URL,
                getNumber("download.pff.timeout")
            );
        }
        if (b) {
            this.mainId = b.id;
            this.cachedMeta = b;
            return b;
        }
        throw `Could not resolve '${this.slug}'!`;
    }

    searchMods(num: number): Promise<ModMeta[]> {
        return searchMetaBySlug(
            this.slug,
            ModrinthModResolver.MR_BASE_URL,
            num,
            getNumber("download.pff.timeout")
        );
    }

    async getArtifactFor(
        gameVersion: string,
        modLoader: ModLoaderType
    ): Promise<ModArtifact> {
        if (this.cachedArtifact) {
            return this.cachedArtifact;
        }
        if (!this.mainId) {
            throw "Must resolve first!";
        }
        this.insideCachedArtifactList =
            this.insideCachedArtifactList ||
            (await getVersionListForMod(
                this.mainId,
                ModrinthModResolver.MR_BASE_URL,
                getNumber("download.pff.timeout")
            ));
        const s = findCompatibleArtifact(
            this.insideCachedArtifactList,
            gameVersion,
            modLoader
        );
        if (s) {
            this.cachedArtifact = s;
            return s;
        }
        throw "Check compatibility first!";
    }

    async canSupport(
        gameVersion: string,
        modLoader: ModLoaderType
    ): Promise<boolean> {
        if (!this.mainId) {
            throw "Must resolve first!";
        }
        this.insideCachedArtifactList =
            this.insideCachedArtifactList ||
            (await getVersionListForMod(
                this.mainId,
                ModrinthModResolver.MR_BASE_URL,
                getNumber("download.pff.timeout")
            ));
        return (
            findCompatibleArtifact(
                this.insideCachedArtifactList,
                gameVersion,
                modLoader
            ) !== undefined
        );
    }

    setSelected(
        mainId: string | undefined,
        artifactId: string | undefined
    ): Promise<void> {
        this.mainId = mainId;
        this.artifactId = artifactId;
        return Promise.resolve();
    }

    clearCached(): Promise<void> {
        this.insideCachedArtifactList = undefined;
        this.cachedMeta = undefined;
        this.cachedArtifact = undefined;
        return Promise.resolve();
    }
}

function transformAddonInfoToMeta(aInfo: AddonInfo): ModMeta {
    const sv: string[] = [];
    aInfo.gameVersionLatestFiles.forEach((f) => {
        if (!sv.includes(f.gameVersion)) {
            sv.push(f.gameVersion);
        }
    });
    return {
        id: aInfo.id.toString(),
        displayName: aInfo.name,
        thumbNail: aInfo.thumbNail,
        supportVersions: sv,
        provider: "Curseforge",
        slug: aInfo.slug
    };
}

export type ModLoaderType = "Forge" | "Fabric" | "Quilt";

export function modLoaderOf(type: number): ModLoaderType {
    if (type === 8) {
        return "Quilt";
    }
    if (type === 4) {
        return "Fabric";
    }
    return "Forge";
}

function transformFileInfoToArtifact(
    file: File,
    modLoader: ModLoaderType
): ModArtifact {
    return {
        downloadUrl: file.downloadUrl,
        fileName: file.fileName,
        gameVersion: file.gameVersion,
        modLoader: modLoader,
        id: file.id.toString(),
        size: file.fileLength
    };
}
