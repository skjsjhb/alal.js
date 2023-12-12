import Sources from '@/constra/sources.json';
import Strategies from '@/constra/strategies.json';
import { Container, ContainerTools } from '@/modules/container/ContainerTools';
import { Locale } from '@/modules/i18n/Locale';
import { JavaGet } from '@/modules/jem/JavaGet';
import { Downloader, DownloadProfile } from '@/modules/net/Downloader';
import { DownloadManager } from '@/modules/net/DownloadManager';
import { fetchJSON } from '@/modules/net/FetchUtil';
import { ProfileTools } from '@/modules/profile/ProfileTools';
import { AssetIndex, Library, VersionProfile } from '@/modules/profile/VersionProfile';
import { Task } from '@/modules/task/Task';
import { createReadStream, createWriteStream, ensureDir, outputJSON } from 'fs-extra';
import path from 'path';
import { pipeline } from 'stream/promises';
import unzip from 'unzipper';

/**
 * Game installer is responsible for installing, checking and repairing game files.
 */
export module GameInstaller {
    const defaultJre = 'jre-legacy';

    /**
     * Prepare game files with version `id`. Installing all necessary components.
     */
    export function installVersionFull(ct: Container, id: string): Task<void> {
        console.log('Full installing ' + id + ' at ' + ct.rootDir);
        if (ct.locked) {
            console.warn('Installing on a locked container: ' + ct.rootDir);
        }
        const taskName = Locale.getTranslation('install.compound', { id });
        return new Task(taskName, 8, async (task) => {
            try {
                const profile = await installProfile(ct, id).link(task).wait();
                const java = profile.javaVersion?.component || defaultJre;
                if (!JavaGet.hasComponent(java)) {
                    await JavaGet.installComponent(java).link(task).wait();
                } else {
                    task.success();
                }
                await installClient(ct, profile).link(task).wait();
                await installLibraries(ct, profile).link(task).wait();
                const ai = await installAssetIndex(ct, profile).link(task).wait();
                await installAssets(ct, profile.assetIndex.id, ai).link(task).wait();
                if (ProfileTools.hasLogConfig(profile)) {
                    await installLogConfig(ct, profile).link(task).wait();
                } else {
                    task.success();
                }
                await unpackNatives(ct, profile).link(task).wait();
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
        const taskName = Locale.getTranslation('install.profile', { id });
        return new Task(taskName, null, async (task) => {
            const prof = await ProfileTools.getMojangProfile(id);
            if (!prof) {
                task.reject('Unable to retrieve profile: ' + id);
                return;
            }
            try {
                await outputJSON(ContainerTools.getProfilePath(ct, id), prof, { spaces: 4 }); // Pretty-print
                ProfileTools.normalize(prof);
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
        const taskName = Locale.getTranslation('install.libraries', { id: prof.id });
        const dl = [];
        for (const l of ProfileTools.effectiveLibraries(prof)) {
            dl.push(createLibraryDownload(ct, l));
        }
        console.log(`Installing libraries for ${prof.id} (${dl.length} entries)`);
        const dlTask = DownloadManager.downloadBatched(dl);
        dlTask.setName(taskName);
        return dlTask;
    }

    /**
     * Install client jar file.
     */
    export function installClient(ct: Container, prof: VersionProfile): Task<void> {
        const taskName = Locale.getTranslation('install.client', { id: prof.id });
        const dl = Downloader.createProfile({
            url: prof.downloads.client.url,
            checksum: prof.downloads.client.sha1,
            validation: 'sha1',
            size: prof.downloads.client.size,
            location: ContainerTools.getClientPath(ct, prof.id)
        });
        console.log('Installing client for ' + prof.id);
        const dlTask = DownloadManager.downloadBatched([dl]);
        dlTask.setName(taskName);
        return dlTask;
    }

    /**
     * Installs asset index.
     */
    export function installAssetIndex(ct: Container, prof: VersionProfile): Task<AssetIndex> {
        const taskName = Locale.getTranslation('install.asset-index', { assets: prof.assetIndex.id });
        return new Task(taskName, 1, async (task) => {
            const manifest = await fetchJSON(prof.assetIndex.url);
            if (!manifest) {
                task.reject('Asset index file not available: ' + prof.assetIndex.url);
                return;
            }
            try {
                const outPath = ContainerTools.getAssetIndexInstallPaths(ct, prof.assetIndex.id, manifest);
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
        const taskName = Locale.getTranslation('install.logging', { id: prof.id });
        const artifact = prof.logging.client.file;
        const profile = Downloader.createProfile({
            url: prof.logging.client.file.url,
            location: ContainerTools.getLogConfigPath(ct, artifact.id),
            size: artifact.size,
            checksum: artifact.sha1,
            validation: 'sha1'
        });
        const dlTask = DownloadManager.downloadBatched([profile]);
        dlTask.setName(taskName);
        return dlTask;
    }

    /**
     * Installs asset files.
     */
    export function installAssets(ct: Container, assetIndexId: string, ai: AssetIndex): Task<void> {
        const taskName = Locale.getTranslation('install.assets', { assets: assetIndexId });
        const batch = [];
        for (const [fileName, { hash, size }] of Object.entries(ai.objects)) {
            // Generate location and URL
            const location = ContainerTools.getAssetPath(ct, assetIndexId, ai, fileName, hash);
            const url = Sources.mojangResources + '/' + hash.substring(0, 2) + '/' + hash;
            batch.push(Downloader.createProfile({
                url, location, size, checksum: hash, validation: 'sha1'
            }));
        }
        const dlTask = DownloadManager.downloadBatched(batch);
        dlTask.setName(taskName);
        return dlTask;
    }

    /**
     * Unpack native libraries for specified profile. The unpacked native libraries will be placed
     * at the same directory as the profile.
     */
    export function unpackNatives(ct: Container, prof: VersionProfile): Task<void> {
        console.log('Unpacking natives for ' + prof.id);
        const nativesDir = ContainerTools.getNativesDirectory(ct, prof.id);
        // Filter out libs
        const elibs = ProfileTools.effectiveLibraries(prof)
            .filter(ProfileTools.isNativeLibrary)
            .filter(ProfileTools.isNativeLibraryAllowed);
        const taskName = Locale.getTranslation('install.natives', { id: prof.id });
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
                const src = ContainerTools.getLibraryPath(ct, l.downloads.artifact.path);
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
            stream.on('entry', async (e: unzip.Entry) => {
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
        const location = ContainerTools.getLibraryPath(ct, l.downloads.artifact.path);
        const url = l.downloads.artifact.url;
        const hash = l.downloads.artifact.sha1;
        const size = l.downloads.artifact.size;
        return Downloader.createProfile({
            url, location, checksum: hash, validation: 'sha1', size
        });
    }
}