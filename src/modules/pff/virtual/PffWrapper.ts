import { copyFile, remove } from "fs-extra";
import { getString } from "../../config/ConfigSupport";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { DownloadMeta } from "../../download/AbstractDownloader";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import { getCachedMod, saveModFileAsCache } from "./Cache";
import { loadLockfile, saveLockfile } from "./Lockfile";
import { AbstractModResolver, ModLoaderType, ModResolver, ModrinthModResolver } from "./Resolver";


export async function fetchSelectedMod(
    rsv: ModResolver,
    gameVersion: string,
    modLoader: ModLoaderType,
    container: MinecraftContainer
): Promise<boolean> {
    const lf = await loadLockfile(container);
    try {
        if (!rsv.mainId) {
            return false;
        }
        if (await rsv.canSupport(gameVersion, modLoader)) {
            const a = await rsv.getArtifactFor(gameVersion, modLoader);
            for (const r of Object.values(lf)) {
                if (r.selectedArtifact.fileName === a.fileName) {
                    return true; // Two mods, one file, do not override or write
                }
            }
            try {
                const pc = await getCachedMod(rsv.mainId, a.id);
                if (pc) {
                    await copyFile(pc, container.getModJar(a.fileName));
                    await rsv.writeLock(lf);
                    await saveLockfile(lf, container);
                    return true;
                }
            } catch (e) {
                console.log("Failed to provide cache for " + rsv.mainId + ": " + e);
            }
            const st = await wrappedDownloadFile(
                new DownloadMeta(
                    a.downloadUrl,
                    container.getModJar(a.fileName),
                    a.hash,
                    a.size
                ),
                true // Mod ln might cause exception
            );
            if (st === 1) {
                try {
                    try {
                        await saveModFileAsCache(
                            container.getModJar(a.fileName),
                            rsv.mainId,
                            a.id
                        );
                    } catch (e) {
                        console.log("Failed to save cache for " + rsv.mainId + ": " + e);
                    }
                    if (getString("pff.upgrade-mode") === "Override") {
                        // Remove old
                        for (const l of Object.values(lf)) {
                            if (l.id === rsv.mainId) {
                                if (hasSameObj(l.selectedArtifact.gameVersion, a.gameVersion)) {
                                    await remove(
                                        container.getModJar(l.selectedArtifact.fileName)
                                    );
                                }
                                break;
                            }
                        }
                    }
                    await rsv.writeLock(lf);
                    await saveLockfile(lf, container);
                } catch (e) {
                    console.log(e);
                } // Lockfile doesn't really matter...
                return true;
            }
            console.log(`Could not fetch artifact: ` + a.downloadUrl);
            return false;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}

function hasSameObj<T>(a: Array<T>, b: Array<T>): boolean {
    for (const o of a) {
        if (b.includes(o)) {
            return true;
        }
    }
    return false;
}

export function getResolvers(
    slug: string,
    _scope?: string // TODO removal
): AbstractModResolver[] {
    return [new ModrinthModResolver(slug)];
}

const PFF_FLAG = "Downloader.IsPff";

// Since args pop is very hard for downloaders
// We will use a flag to do this
// 1 - Use pff config
// Any other value - Use common config
export function setPffFlag(value: string): void {
    sessionStorage.setItem(PFF_FLAG, value);
}
