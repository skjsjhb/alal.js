import Sources from '@/constra/sources.json';
import Strategies from '@/constra/strategies.json';
import { Container } from '@/modules/container/Container';
import { TR } from '@/modules/i18n/Locale';
import { hasJavaComponent, installJavaComponent } from '@/modules/jem/JavaGet';
import { createDownload, DownloadProfile } from '@/modules/net/Downloader';
import { downloadBatched } from '@/modules/net/DownloadManager';
import { fetchJSON } from '@/modules/net/FetchUtil';
import {
    fetchMojangProfile,
    getProfileEffectiveLibraries,
    hasLogConfig,
    isNativeLibrary,
    isNativeLibraryAllowed,
    normalizeProfile
} from '@/modules/profile/ProfileTools';
import { AssetIndex, Library, VersionProfile } from '@/modules/profile/VersionProfile';
import { Task } from '@/modules/task/Task';
import { createReadStream, createWriteStream, ensureDir, outputJSON } from 'fs-extra';
import path from 'path';
import { pipeline } from 'stream/promises';
import unzip from 'unzipper';

/**
 * Game installer is responsible for installing, checking and repairing game files.
 */
const defaultJre = 'jre-legacy';

export enum GameInstallVariant {
    FULL = 'FULL', // Everything
    LIBS = 'LIBS', // Libraries, client and profile
    INDEX = 'INDEX' // Profile only
}

/**
 * Prepare game files with version `id`. Installing all necessary components.
 */
export function installGame(
    ct: Container,
    id: string,
    variant: GameInstallVariant = GameInstallVariant.FULL
): Task<void> {
    console.log('Installing ' + id + ' at ' + ct.rootDir + ' [' + variant + ']');
    if (ct.locked) {
        console.warn('Installing on a locked container: ' + ct.rootDir);
    }
    const taskName = TR('install.compound', { id });
    let taskCount = 1;
    if (variant === GameInstallVariant.FULL) {
        taskCount = 8;
    } else if (variant === GameInstallVariant.LIBS) {
        taskCount = 4;
    }
    return new Task(taskName, taskCount, async (task) => {
        try {
            const profile = await installProfile(ct, id).link(task).wait();
            const java = profile.javaVersion?.component || defaultJre;
            const assetIndex = await installAssetIndex(ct, profile).link(task).wait();

            if (variant == GameInstallVariant.FULL) {
                if (!hasJavaComponent(java)) {
                    await installJavaComponent(java).link(task).wait();
                } else {
                    task.success();
                }
            }

            if (variant != GameInstallVariant.INDEX) {
                await installClient(ct, profile).link(task).wait();
                await installLibraries(ct, profile).link(task).wait();
                await unpackNatives(ct, profile).link(task).wait();
            }

            if (variant == GameInstallVariant.FULL) {
                await installAssets(ct, profile.assetIndex.id, assetIndex!).link(task).wait();
                if (hasLogConfig(profile)) {
                    await installLogConfig(ct, profile).link(task).wait();
                } else {
                    task.success();
                }
            }
            console.log('Install ' + id + ' completed.');
            task.resolve();
        } catch (e) {
            task.reject('Failed to install ' + id + ': ' + e);
        }
    });
}

/**
 * Install a Mojang profile. This method resolves the profile, save it, then return the normalized profile
 * for further uses.
 *
 * This method doesn't check for the existence of the target. Duplicated profiles will be overridden.
 */
export function installProfile(ct: Container, id: string): Task<VersionProfile> {
    console.log('Installing profile ' + id);
    const taskName = TR('install.profile', { id });
    return new Task(taskName, null, async (task) => {
        const prof = await fetchMojangProfile(id);
        if (!prof) {
            task.reject('Unable to retrieve profile: ' + id);
            return;
        }
        try {
            await outputJSON(ct.getProfilePath(id), prof, { spaces: 4 }); // Pretty-print
            normalizeProfile(prof);
            task.resolve(prof);
        } catch (e) {
            task.reject('Could not write profile: ' + e);
        }
    });
}

/**
 * Install libraries. This method forwards a download task with its name set to libraries installation.
 */
export function installLibraries(ct: Container, prof: VersionProfile): Task<void> {
    const taskName = TR('install.libraries', { id: prof.id });
    const dl = [];
    for (const l of getProfileEffectiveLibraries(prof)) {
        dl.push(createLibraryDownload(ct, l));
    }
    console.log(`Installing libraries for ${prof.id} (${dl.length} entries)`);
    const dlTask = downloadBatched(dl);
    dlTask.setName(taskName);
    return dlTask;
}

/**
 * Install client jar file.
 */
export function installClient(ct: Container, prof: VersionProfile): Task<void> {
    const taskName = TR('install.client', { id: prof.id });
    const dl = createDownload({
        url: prof.downloads.client.url,
        checksum: prof.downloads.client.sha1,
        validation: 'sha1',
        size: prof.downloads.client.size,
        location: ct.getClientPath(prof.id)
    });
    console.log('Installing client for ' + prof.id);
    const dlTask = downloadBatched([dl]);
    dlTask.setName(taskName);
    return dlTask;
}

/**
 * Installs asset index.
 */
export function installAssetIndex(ct: Container, prof: VersionProfile): Task<AssetIndex> {
    const taskName = TR('install.asset-index', { assets: prof.assetIndex.id });
    return new Task(taskName, 1, async (task) => {
        const manifest = await fetchJSON(prof.assetIndex.url);
        if (!manifest) {
            task.reject('Asset index file not available: ' + prof.assetIndex.url);
            return;
        }
        try {
            const outPath = ct.getAssetIndexInstallPaths(prof.assetIndex.id, manifest);
            for (const p of outPath) {
                await outputJSON(p, manifest);
            }
            task.success();
            task.resolve(manifest);
        } catch (e) {
            task.fail();
            task.reject('Could not write asset index ' + prof.assetIndex.id + ': ' + e);
        }
    });
}

export function installLogConfig(ct: Container, prof: VersionProfile): Task<void> {
    const taskName = TR('install.logging', { id: prof.id });
    const artifact = prof.logging.client.file;
    const profile = createDownload({
        url: prof.logging.client.file.url,
        location: ct.getLogConfigPath(artifact.id),
        size: artifact.size,
        checksum: artifact.sha1,
        validation: 'sha1'
    });
    const dlTask = downloadBatched([profile]);
    dlTask.setName(taskName);
    return dlTask;
}

/**
 * Installs asset files.
 */
export function installAssets(ct: Container, assetIndexId: string, ai: AssetIndex): Task<void> {
    const taskName = TR('install.assets', { assets: assetIndexId });
    const batch = [];
    for (const [fileName, { hash, size }] of Object.entries(ai.objects)) {
        // Generate location and URL
        const location = ct.getAssetPath(assetIndexId, ai, fileName, hash);
        const url = Sources.mojangResources + '/' + hash.substring(0, 2) + '/' + hash;
        batch.push(
            createDownload({
                url,
                location,
                size,
                checksum: hash,
                validation: 'sha1'
            })
        );
    }
    const dlTask = downloadBatched(batch);
    dlTask.setName(taskName);
    return dlTask;
}

/**
 * Unpack native libraries for specified profile. The unpacked native libraries will be placed
 * at the same directory as the profile.
 */
export function unpackNatives(ct: Container, prof: VersionProfile): Task<void> {
    console.log('Unpacking natives for ' + prof.id);
    const nativesDir = ct.getNativesDirectory(prof.id);
    // Filter out libs
    const elibs = getProfileEffectiveLibraries(prof).filter(isNativeLibrary).filter(isNativeLibraryAllowed);
    const taskName = TR('install.natives', { id: prof.id });
    return new Task(taskName, elibs.length, async (task) => {
        try {
            await ensureDir(nativesDir);
        } catch (e) {
            const errMsg = 'Could not create natives extraction directory ' + nativesDir + ': ' + e;
            console.error(errMsg);
            task.reject(errMsg);
            return;
        }
        for (const l of elibs) {
            console.log('Extracting ' + l.name);
            const src = ct.getLibraryPath(l.downloads.artifact.path);
            try {
                await filterAndExtractNatives(src, nativesDir);
                task.success();
            } catch (e) {
                console.error('Could not unpack native library ' + l.name + ': ' + e);
                task.fail();
            }
        }
        if ((task.progress?.failed || 0) > 0) {
            task.reject('Failed to unpack some native libraries.');
        } else {
            task.resolve();
        }
    });
}

function filterAndExtractNatives(src: string, dest: string): Promise<void> {
    const regex = new RegExp(Strategies.installer.nativesRegex);
    let closed = false;
    const stream = createReadStream(src).pipe(unzip.Parse());
    return new Promise((res, rej) => {
        stream
            .on('entry', async (e: unzip.Entry) => {
                if (closed || e.path.endsWith('/')) {
                    return;
                }
                if (regex.test(e.path)) {
                    try {
                        const fileName = path.basename(e.path);
                        await pipeline(e, createWriteStream(path.join(dest, fileName)));
                    } catch (err) {
                        closed = true;
                        stream.destroy();
                        rej(err);
                    }
                } else {
                    e.autodrain();
                }
            })
            .on('error', (e) => {
                closed = true;
                stream.destroy();
                rej(e);
            })
            .on('end', res);
    });
}

// Convert a library artifact to download profile
function createLibraryDownload(ct: Container, l: Library): DownloadProfile {
    const location = ct.getLibraryPath(l.downloads.artifact.path);
    const url = l.downloads.artifact.url;
    const hash = l.downloads.artifact.sha1;
    const size = l.downloads.artifact.size;
    return createDownload({
        url,
        location,
        checksum: hash,
        validation: 'sha1',
        size
    });
}
