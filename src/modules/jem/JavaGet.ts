import Sources from '@/constra/sources.json';
import { decompressLZMA } from '@/modules/data/Compressing';
import { opt } from '@/modules/data/Options';
import { getRuntimeDataPath } from '@/modules/data/Paths';
import { getRegTable } from '@/modules/data/Registry';
import { TR } from '@/modules/i18n/Locale';
import { createDownload, DownloadProfile } from '@/modules/net/Downloader';
import { downloadBatched } from '@/modules/net/DownloadManager';
import { fetchJSON } from '@/modules/net/FetchUtil';
import { Task } from '@/modules/task/Task';
import { alSupports } from '@/modules/util/Availa';
import { OSType } from '@/modules/util/OSType';
import { chmod, ensureDir, remove } from 'fs-extra';
import os from 'os';
import path from 'path';

/**
 * Implementing Mojang JRE component downloading.
 */
let jreStorePath: string;
const javaGetRegistryId = 'java-get';

// See https://piston-meta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json
type MojangJavaPlatforms =
    | 'gamecore'
    | 'linux'
    | 'linux-i386'
    | 'mac-os'
    | 'mac-os-arm64'
    | 'windows-arm64'
    | 'windows-x64'
    | 'windows-x86';

type MojangJavaManifest = {
    // The keys have their names (e.g. java-runtime-gamma), but that's not our interest
    [key in MojangJavaPlatforms]: Record<string, MojangJavaProfile[]>;
};

// See https://piston-meta.mojang.com/v1/packages/5e91f68978e873ef3b4f533dc1dcb73c2e9efff7/manifest.json
interface MojangJavaDownloadManifest {
    files: Record<string, MojangJavaFileDownload>;
}

interface MojangJavaFileDownload {
    downloads?: {
        lzma?: MojangJavaFileArtifact;
        raw: MojangJavaFileArtifact;
    };
    executable?: boolean;
    type: 'file' | 'directory';
}

interface MojangJavaFileArtifact {
    sha1: string;
    size: number;
    url: string;
}

interface MojangJavaProfile {
    availability: {
        group: number;
        progress: number;
    };
    manifest: {
        sha1: string;
        size: number;
        url: string;
    };
    version: {
        name: string;
        released: string;
    };
}

/**
 * Configures and ensures the root directory.
 */
export async function initJavaGet() {
    try {
        jreStorePath = getRuntimeDataPath('jre');
        await ensureDir(jreStorePath);
    } catch (e) {
        console.error('Could not create JRE store path: ' + e);
    }
}

// Gets Mojang JRE manifest
async function retrieveIndexManifest(): Promise<MojangJavaManifest> {
    const res = await fetchJSON(Sources.mojangJavaRuntimeManifest);
    if (!res) {
        console.error('Could not retrieve index manifest!');
    }
    return res;
}

async function retrieveDownloadManifest(u: string): Promise<MojangJavaDownloadManifest> {
    const res = await fetchJSON(u);
    if (!res) {
        console.error('Could not retrieve manifest: ' + u);
    }
    return res;
}

function resolveComponentDownloadManifest(c: string): Task<MojangJavaDownloadManifest> {
    return new Task('java-get.resolve', null, async (task) => {
        try {
            const matrix = await retrieveIndexManifest();
            const platform = getMojangNamedPlatform();
            if (!(platform in matrix)) {
                task.reject('Platform ' + platform + ' not supported by JavaGet.');
            }
            const componentProfile = matrix[platform as MojangJavaPlatforms][c];
            if (!componentProfile || componentProfile.length == 0) {
                task.reject('No JRE component named ' + c + ' for platform ' + platform);
            }
            const component = componentProfile[0];
            const manifest = await retrieveDownloadManifest(component.manifest.url);
            task.resolve(manifest);
        } catch (e) {
            task.reject(e);
        }
    });
}

// Exclude unnecessary files e.g. documents from downloading in-place. Controlled by options.
function optimizeFiles(f: MojangJavaDownloadManifest): void {
    if (opt().jem.optimize) {
        const files = f.files;
        for (const [fileName, profile] of Object.entries(files)) {
            // Exclude legal files and directories
            if (fileName.startsWith('legal/') || profile.type == 'directory') {
                delete files[fileName];
            }
        }
    }
}

/**
 * Install specified JRE component.
 */
export function installJavaComponent(componentName: string): Task<void> {
    const taskName = TR('java-get.get', { name: componentName });
    return new Task(taskName, 3, async (task) => {
        try {
            // Fetch manifest
            console.log('Fetching JRE download manifest for ' + componentName);
            const dlManifest = await resolveComponentDownloadManifest(componentName).link(task).wait();

            // Optimize files
            console.log('Optimizing JRE files.');
            optimizeFiles(dlManifest);

            // Download files in batch
            console.log('Downloading files for ' + componentName);
            const downloadBatch = generateDownloadProfileList(componentName, dlManifest);
            const downloadTask = downloadBatched(downloadBatch);
            downloadTask.setName(TR('java-get.download', { name: componentName })); // Rename
            await downloadTask.link(task).wait();

            // Post process
            console.log('Processing files for ' + componentName);
            await postProcessFiles(componentName, dlManifest).link(task).wait();

            // Add to registry
            const jgt = getRegTable<string[]>(javaGetRegistryId, []);
            if (!jgt.includes(componentName)) {
                jgt.push(componentName);
            }
            console.log('Installed ' + componentName);
            task.resolve();
        } catch (e) {
            task.reject(e);
        }
    });
}

/**
 * Gets the path to the executable (`java` or `java.exe`) of specified component.
 *
 * This method does not check for file existence. The returned path can even not exist.
 * @param c JRE component name.
 */
export function getJavaExecutable(c: string): string {
    let pathToJava = 'bin/java';
    if (OSType.self() == OSType.WINDOWS) {
        pathToJava = 'bin/java.exe';
    } else if (OSType.self() == OSType.MACOS) {
        pathToJava = 'jre.bundle/Contents/Home/bin/java';
    }
    return path.join(jreStorePath, c, pathToJava);
}

/**
 * Check whether the specified component has installed (in records).
 */
export function hasJavaComponent(c: string): boolean {
    return getRegTable<string[]>(javaGetRegistryId, []).includes(c);
}

// Batch version
function generateDownloadProfileList(componentName: string, manifest: MojangJavaDownloadManifest): DownloadProfile[] {
    const downloadBatch = [];
    for (const [fileName, profile] of Object.entries(manifest.files)) {
        const prof = generateDownloadProfile(componentName, fileName, profile);
        if (prof) {
            downloadBatch.push(prof);
        }
    }
    return downloadBatch;
}

function generateDownloadProfile(
    componentName: string,
    fileName: string,
    profile: MojangJavaFileDownload
): DownloadProfile | null {
    const originalPath = path.join(jreStorePath, componentName, fileName);
    const archivePath = originalPath + '.lzma'; // Files are compressed
    if (!profile.downloads) {
        return null; // Directories are automatically created
    } else {
        if (profile.downloads.lzma && alSupports('lzma-native')) {
            // Download LZMA
            return createDownload({
                url: profile.downloads.lzma.url,
                location: archivePath,
                size: profile.downloads.lzma.size,
                checksum: profile.downloads.lzma.sha1,
                validation: 'sha1'
            });
        } else {
            // Download RAW
            return createDownload({
                url: profile.downloads.raw.url,
                location: originalPath,
                size: profile.downloads.raw.size,
                checksum: profile.downloads.raw.sha1,
                validation: 'sha1'
            });
        }
    }
}

// Get Mojang used name for indexing the component.
function getMojangNamedPlatform(): string {
    let sys: string;
    switch (os.platform()) {
        case 'darwin':
            sys = 'mac-os';
            break;
        case 'win32':
            sys = 'windows';
            break;
        case 'linux':
        default: // alal.js does not have releases on other platforms
            sys = 'linux';
            break;
    }

    if (OSType.self().isARM()) {
        sys += '-arm64';
    }
    if (os.arch() == 'x64' && sys == 'windows') {
        sys += '-x64';
    }
    return sys;
}

function postProcessFiles(componentName: string, manifest: MojangJavaDownloadManifest): Task<void> {
    const taskName = TR('java-get.post-process', { name: componentName });
    return new Task(taskName, Object.keys(manifest.files).length, async (task) => {
        const results: [boolean, string][] = await Promise.all(
            Object.entries(manifest.files).map(async ([location, dl]) => {
                const state = await postProcessFile(componentName, location, dl);
                if (state) {
                    task.success();
                } else {
                    task.fail();
                }
                return [state, location];
            })
        );

        if (results.every((r) => r[0])) {
            task.resolve();
        } else {
            const [, p] = results.find((r) => !r[0])!;
            task.reject(`Some files failed to decompress | chmod. (e.g. ${p})`);
        }
    });
}

async function postProcessFile(componentName: string, location: string, dl: MojangJavaFileDownload): Promise<boolean> {
    const originalPath = path.join(jreStorePath, componentName, location);
    const archivePath = originalPath + '.lzma';

    // Decompress
    if (dl.downloads?.lzma && alSupports('lzma-native')) {
        if (!(await decompressLZMA(archivePath, originalPath))) {
            return false; // Decompression failed
        }
        await remove(archivePath);
    }

    // Chmod
    if (dl.executable) {
        try {
            await chmod(originalPath, 0o775);
            console.log('Made executable: ' + originalPath);
        } catch (e) {
            console.error('Could not make file executable for ' + originalPath + ': ' + e);
        }
    }
    return true;
}
