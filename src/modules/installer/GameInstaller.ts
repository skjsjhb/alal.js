import Defaults from "@/constra/defaults.json";
import { Container, ContainerTools } from "@/modules/container/ContainerTools";
import { Locale } from "@/modules/i18n/Locale";
import { Downloader, DownloadProfile } from "@/modules/net/Downloader";
import { DownloadManager } from "@/modules/net/DownloadManager";
import { ProfileTools } from "@/modules/profile/ProfileTools";
import { Library, VersionProfile } from "@/modules/profile/VersionProfile";
import { Task } from "@/modules/task/Task";
import { createReadStream, createWriteStream, ensureDir, outputJSON } from "fs-extra";
import path from "path";
import { pipeline } from "stream/promises";
import unzip from "unzipper";

/**
 * Game installer is responsible for installing, checking and repairing game files.
 */
export namespace GameInstaller {
    /**
     * Install a Mojang profile. This method resolves the profile, save it, then return the normalized profile
     * for further uses.
     *
     * This method doesn't check for the existence of the target. Duplicated profiles will be overridden.
     */
    export function installProfile(ct: Container, id: string): Task<VersionProfile | null> {
        console.log("Installing profile " + id);
        const taskName = Locale.getTranslation("install.profile");
        return new Task(taskName, null, async (task) => {
            const prof = await ProfileTools.getMojangProfile(id);
            if (!prof) {
                task.fail("Unable to retrieve profile: " + id);
                return;
            }
            try {
                await outputJSON(ContainerTools.getProfilePath(ct, id), prof, {spaces: 4}); // Pretty-print
                ProfileTools.normalize(prof);
                task.resolve(prof);
            } catch (e) {
                task.fail("Could not write profile: " + e);
            }
        });
    }

    /**
     * Install libraries. This method forwards a download task with its name set to libraries installation.
     */
    export function installLibraries(ct: Container, prof: VersionProfile): Task<void> {
        const taskName = Locale.getTranslation("install.libraries");
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
        const taskName = Locale.getTranslation("install.client");
        const dl = Downloader.createProfile({
            url: prof.downloads.client.url,
            checksum: prof.downloads.client.sha1,
            validation: "sha1",
            size: prof.downloads.client.size,
            location: ContainerTools.getClientPath(ct, prof.id)
        });
        console.log("Installing client for " + prof.id);
        const dlTask = DownloadManager.downloadBatched([dl]);
        dlTask.setName(taskName);
        return dlTask;
    }


    /**
     * Unpack native libraries for specified profile. The unpacked native libraries will be placed
     * at the same directory as the profile.
     */
    export function unpackNatives(ct: Container, prof: VersionProfile): Task<void> {
        console.log("Unpacking natives for " + prof.id);
        const nativesDir = ContainerTools.getNativesDirectory(ct, prof.id);
        // Filter out libs
        const elibs = ProfileTools.effectiveLibraries(prof)
            .filter(ProfileTools.isNativeLibrary)
            .filter(ProfileTools.isNativeRequired);
        return new Task(Locale.getTranslation("install.natives"), elibs.length, async (task) => {
            try {
                await ensureDir(nativesDir);
            } catch (e) {
                const errMsg = "Could not create natives extraction directory " + nativesDir + ": " + e;
                console.error(errMsg);
                task.fail(errMsg);
                return;
            }
            for (const l of elibs) {
                console.log("Extracting " + l.name);
                const src = ContainerTools.getLibraryPath(ct, l.downloads.artifact.path);
                try {
                    await filterAndExtractNatives(src, nativesDir);
                    task.addSuccess();
                } catch (e) {
                    console.error("Could not unpack native library " + l.name + ": " + e);
                    task.addFailed();
                }
            }
            if ((task.progress?.failed || 0) > 0) {
                task.fail("Failed to unpack some native libraries.");
            } else {
                task.resolve();
            }
        });
    }

    function filterAndExtractNatives(src: string, dest: string): Promise<void> {
        const regex = new RegExp(Defaults.installer.nativesRegex);
        return new Promise(async (res, rej) => {
            let closed = false;
            const stream = createReadStream(src).pipe(unzip.Parse());
            stream.on("entry", async (e: unzip.Entry) => {
                if (closed || e.path.endsWith("/")) {
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
                .on("error", (e) => {
                    closed = true;
                    stream.destroy();
                    rej(e);
                })
                .on("end", res);
        });
    }

    // Convert a library artifact to download profile
    function createLibraryDownload(ct: Container, l: Library): DownloadProfile {
        const location = ContainerTools.getLibraryPath(ct, l.downloads.artifact.path);
        const url = l.downloads.artifact.url;
        const hash = l.downloads.artifact.sha1;
        const size = l.downloads.artifact.size;
        return Downloader.createProfile({
            url, location, checksum: hash, validation: "sha1", size
        });
    }
}