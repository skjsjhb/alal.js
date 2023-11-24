import Sources from "@/constra/sources.json";
import { Locale } from "@/modules/i18n/Locale";
import { Files } from "@/modules/redata/Files";
import { Paths } from "@/modules/redata/Paths";
import { Registry } from "@/modules/redata/Registry";
import { ReOptions } from "@/modules/redata/ReOptions";
import { Downloader } from "@/modules/renet/Downloader";
import { DownloadManager } from "@/modules/renet/DownloadManager";
import { Mirrors } from "@/modules/renet/Mirrors";
import { Task } from "@/modules/task/Task";
import { OSInfo } from "@/modules/util/OSInfo";
import { chmod, ensureDir, remove } from "fs-extra";
import os from "os";
import path from "path";
import OSType = OSInfo.OSType;

/**
 * Implementing Mojang JRE component downloading.
 */
export namespace JavaGet {
    import DownloadProfile = Downloader.DownloadProfile;
    let jreStorePath: string;
    let javaGetRegistryId = "java-get";

    // See https://piston-meta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json
    type MojangJavaPlatforms = "gamecore" | "linux" | "linux-i386" | "mac-os"
        | "mac-os-arm64" | "windows-arm64" | "windows-x64" | "windows-x86";

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
        type: "file" | "directory";
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
    export async function configure() {
        try {
            jreStorePath = Paths.getDataPath("jre");
            await ensureDir(jreStorePath);
        } catch (e) {
            console.error("Could not create JRE store path: " + e);
        }
    }

    // Gets Mojang JRE manifest
    async function retrieveIndexManifest(): Promise<MojangJavaManifest> {
        const url = Mirrors.apply(Sources.mojangJavaRuntimeManifest);
        const res = await fetch(url);
        if (!res.ok) {
            console.error("Could not retrieve index manifest: " + res.status);
        }
        return await res.json();
    }

    async function retrieveDownloadManifest(u: string): Promise<MojangJavaDownloadManifest> {
        const url = Mirrors.apply(u);
        const res = await fetch(url);
        if (!res.ok) {
            console.error("Could not retrieve manifest " + u + ": " + res.status);
        }
        return await res.json();
    }

    function resolveComponentDownloadManifest(c: string): Task<MojangJavaDownloadManifest> {
        return new Task("java-get.resolve", null, async (task) => {
            try {
                const matrix = await retrieveIndexManifest();
                const platform = getMojangNamedPlatform();
                const componentProfile = matrix[platform as MojangJavaPlatforms][c];
                if (!componentProfile || componentProfile.length == 0) {
                    task.fail("No JRE component named " + c + " for platform " + platform);
                }
                const component = componentProfile[0];
                const manifest = await retrieveDownloadManifest(component.manifest.url);
                task.resolve(manifest);
            } catch (e) {
                task.fail(e);
            }
        });


    }

    // Exclude unnecessary files e.g. documents from downloading in-place. Controlled by options.
    function optimizeFiles(f: MojangJavaDownloadManifest): void {
        if (ReOptions.get().jem.optimize) {
            const files = f.files;
            for (const [fileName, profile] of Object.entries(files)) {
                // Exclude legal files and directories
                if (fileName.startsWith("legal/") || profile.type == "directory") {
                    delete files[fileName];
                }
            }
        }
    }

    /**
     * Install specified JRE component.
     */
    export function installComponent(componentName: string): Task<void> {
        const taskName = Locale.getTranslation("java-get.get", {name: componentName});
        return new Task(taskName, 3, async (task) => {
            try {
                // Fetch manifest
                console.log("Fetching JRE download manifest for " + componentName);
                const dlManifest = await resolveComponentDownloadManifest(componentName).linkTo(task).whenFinish();
                task.addSuccess();

                // Optimize files
                console.log("Optimizing JRE files.");
                optimizeFiles(dlManifest);

                // Download files in batch
                console.log("Downloading files for " + componentName);
                const downloadBatch = generateDownloadProfileList(componentName, dlManifest);
                const downloadTask = DownloadManager.downloadBatched(downloadBatch);
                downloadTask.setName(Locale.getTranslation("java-get.download", {name: componentName})); // Rename
                await downloadTask.linkTo(task).whenFinish();
                task.addSuccess();

                // Post process
                console.log("Processing files for " + componentName);
                await postProcessFiles(componentName, dlManifest).linkTo(task).whenFinish();
                task.addSuccess();

                // Add to registry
                const jgt = Registry.getTable<string[]>(javaGetRegistryId, []);
                if (!jgt.includes(componentName)) {
                    jgt.push(componentName);
                }
                console.log("Installed " + componentName);
                task.resolve();
            } catch (e) {
                task.fail(e);
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
        let pathToJava = "bin/java";
        if (OSInfo.getSelf() == OSType.WINDOWS) {
            pathToJava = "bin/java.exe";
        }
        return path.join(jreStorePath, c, pathToJava);
    }

    /**
     * Check whether the specified component has installed (in records).
     */
    export function hasComponent(c: string): boolean {
        return Registry.getTable<string[]>(javaGetRegistryId, []).includes(c);
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

    function generateDownloadProfile(componentName: string, fileName: string, profile: MojangJavaFileDownload): DownloadProfile | null {
        const originalPath = path.join(jreStorePath, componentName, fileName);
        const archivePath = originalPath + ".lzma"; // Files are compressed
        if (!profile.downloads) {
            return null; // Directories are automatically created
        } else {
            if (profile.downloads.lzma) {
                // Download LZMA
                return Downloader.createProfile({
                    url: profile.downloads.lzma.url,
                    location: archivePath,
                    size: profile.downloads.lzma.size,
                    checksum: profile.downloads.lzma.sha1,
                    validation: "sha1"
                });
            } else {
                // Download RAW
                return Downloader.createProfile({
                    url: profile.downloads.raw.url,
                    location: originalPath,
                    size: profile.downloads.raw.size,
                    checksum: profile.downloads.raw.sha1,
                    validation: "sha1"
                });
            }
        }
    }

    // Get Mojang used name for indexing the component.
    function getMojangNamedPlatform(): string {
        let sys: string, arch = "";
        switch (os.platform()) {
            case "darwin":
                sys = "mac-os";
                break;
            case "win32":
                sys = "windows";
                break;
            case "linux":
            default: // ALAL does not have releases on other platforms
                sys = "linux";
                break;
        }

        switch (os.arch()) {
            case "arm64":
                arch = "arm64";
                break;
            case "ia32":
                arch = sys == "windows" ? "x86" : "i386";
                break;
            case "x64":
                arch = "x64";
                break;
        }
        return sys + "-" + arch;
    }

    function postProcessFiles(componentName: string, manifest: MojangJavaDownloadManifest): Task<void> {
        const taskName = Locale.getTranslation("java-get.post-process", {name: componentName});
        return new Task(taskName, Object.keys(manifest.files).length, async (task) => {
            const results = await Promise.all(Object.entries(manifest.files).map(async ([location, dl]) => {
                const state = await postProcessFile(componentName, location, dl);
                if (state) {
                    task.addSuccess();
                } else {
                    task.addFailed();
                }
                return state;
            }));

            if (results.every(r => r)) {
                task.resolve();
            } else {
                task.fail("Some files failed to decompress | chmod.");
            }
        });
    }

    async function postProcessFile(componentName: string, location: string, dl: MojangJavaFileDownload): Promise<boolean> {
        const originalPath = path.join(jreStorePath, componentName, location);
        const archivePath = originalPath + ".lzma";

        // Decompress
        if (dl.downloads?.lzma) {
            if (!await Files.decompressLZMA(archivePath, originalPath)) {
                return false; // Decompression failed
            }
            await remove(archivePath);
        }

        // Chmod
        if (dl.executable) {
            try {
                await chmod(originalPath, 0o775);
                console.log("Made executable: " + originalPath);
            } catch (e) {
                console.error("Could not make file executable for " + originalPath + ": " + e);
            }
        }
        return true;
    }
}