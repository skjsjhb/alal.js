import { Files } from "@/modules/redata/Files";
import { ReOptions } from "@/modules/redata/ReOptions";
import { Downloader } from "@/modules/renet/Downloader";
import { Task } from "@/modules/task/Task";
import { Throttle } from "@/modules/util/Throttle";
import { stat } from "fs-extra";

/**
 * Batched file download manager.
 *
 * Note that this module is different from Downloader, as the manager checks for file existence, manage concurrency and
 * summary the download progress on the fly. The download manager also generates tasks for tracing.
 */
export namespace DownloadManager {
    const pool = new Throttle.Pool(32);

    export function configure() {
        const limit = ReOptions.get().download.maxTasks;
        console.log("Max tasks for download: " + limit);
        pool.setLimit(limit);
    }

    /**
     * Resolves a batch of download profiles, with an optional progress signal.
     */
    export function downloadBatched(batch: Downloader.DownloadProfile[]): Task<void> {
        return new Task("download.batch", batch.length, async (task) => {
            const results = await Promise.all(batch.map(async (p) => {
                await pool.acquire();
                const res = await downloadSingleInBatched(p);
                if (res) {
                    task.addSuccess();
                } else {
                    task.addFailed();
                }
                console.log(task.getProgressString());
                pool.release();
                return res;
            }));
            if (results.every(r => r)) {
                task.resolve();
            } else {
                task.fail("Some files failed to download.");
            }
            return results.every((r) => r);
        });

    }

    async function downloadSingleInBatched(p: Downloader.DownloadProfile): Promise<boolean> {
        if (await checkForExistence(p)) {
            console.log("Fnd: " + p.url);
            return true;
        }
        return await Downloader.downloadFile(p);
    }

    // Check whether the target file already exists, matching the profile-specified checksum and size.
    async function checkForExistence(prof: Downloader.DownloadProfile): Promise<boolean> {
        if (!await Files.exists(prof.location)) {
            return false;
        }
        switch (prof.validation) {
            case "":
                return true;
            case "size":
                if (prof.size < 0) { return true; } // Cannot check, assume correct
                try {
                    const st = await stat(prof.location);
                    return st.size == prof.size;
                } catch { return false; }
            default:
                if (!prof.checksum) { return true; }
                return await Files.checkIntegrity(prof.location, prof.checksum, prof.validation);
        }
    }
}