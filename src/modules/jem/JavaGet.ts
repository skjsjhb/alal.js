import Sources from "@/constra/sources.json";
import { Files } from "@/modules/redata/Files";
import { Paths } from "@/modules/redata/Paths";
import { Registry } from "@/modules/redata/Registry";
import { Downloader } from "@/modules/renet/Downloader";
import { DownloadManager } from "@/modules/renet/DownloadManager";
import { Mirrors } from "@/modules/renet/Mirrors";
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
            throw "Could not retrieve index manifest: " + res.status;
        }
        return await res.json();
    }

    async function retrieveDownloadManifest(u: string): Promise<MojangJavaDownloadManifest> {
        const url = Mirrors.apply(u);
        const res = await fetch(url);
        if (!res.ok) {
            throw "Could not retrieve manifest " + u + ": " + res.status;
        }
        return await res.json();
    }

    /**
     * Install specified JRE component.
     */
    export async function installComponent(componentName: string): Promise<boolean> {
        console.log("Installing JRE component: " + componentName);
        // Retrieve manifest
        const matrix = await retrieveIndexManifest();
        const platform = getMojangNamedPlatform();
        if (!matrix || !(platform in matrix)) {
            console.error("Platform " + platform + " does not have official JRE index.");
            return false;
        }
        const componentProfile = matrix[platform as MojangJavaPlatforms][componentName];
        if (!componentProfile || componentProfile.length == 0) {
            console.error("No JRE component named " + componentName + " for platform " + platform);
            return false;
        }
        const component = componentProfile[0];
        const dlManifest = await retrieveDownloadManifest(component.manifest.url);
        console.log("Fetched JRE download manifest for " + componentName);

        // Download files in batch
        const downloadBatch = [];

        for (const [fileName, profile] of Object.entries(dlManifest.files)) {
            const prof = generateDownloadProfile(componentName, fileName, profile);
            if (prof) {
                downloadBatch.push(prof);
            }
        }
        console.log("Downloading files for " + componentName);
        if (!await DownloadManager.downloadBatched(downloadBatch)) {
            console.error("Some files failed to download for JRE component " + componentName);
            return false;
        }

        // Post process
        console.log("Processing files for " + componentName);
        const postProcessPromos = Object.entries(dlManifest.files)
            .map(([fileName, profile]) => postProcessFile(componentName, fileName, profile));
        const postProcessResult = await Promise.all(postProcessPromos);
        const succ = postProcessResult.every((r) => r);
        if (!succ) {
            console.error("Some files failed to process for " + componentName);
            return false;
        }

        // Add to registry
        const jgt = Registry.getTable<string[]>(javaGetRegistryId, []);
        if (!jgt.includes(componentName)) {
            jgt.push(componentName);
        }
        console.log("Installed " + componentName);
        return true;
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