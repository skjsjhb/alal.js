import { checkFileIntegrity, hasFile } from '@/modules/data/Files';
import { opt } from '@/modules/data/Options';
import { downloadFile, DownloadProfile } from '@/modules/net/Downloader';
import { Task } from '@/modules/task/Task';
import { Pool } from '@/modules/util/Throttle';
import { stat } from 'fs-extra';

/**
 * Batched file download manager.
 *
 * Note that this module is different from Downloader, as the manager checks for file existence, manage concurrency and
 * summary the download progress on the fly. The download manager also generates tasks for tracing.
 */
let pool: Pool;

/**
 * Resolves a batch of download profiles, with an optional progress signal.
 */
export function downloadBatched(batch: DownloadProfile[]): Task<void> {
    pool || configure();
    return new Task('download.batch', batch.length, async (task) => {
        const results: [boolean, string][] = await Promise.all(
            batch.map(async (p) => {
                await pool.acquire();
                const res = await downloadSingleInBatched(p);
                if (res) {
                    task.success();
                } else {
                    task.fail();
                }
                pool.release();
                return [res, p.url];
            })
        );
        if (results.every((r) => r[0])) {
            task.resolve();
        } else {
            const [, url] = results.find((r) => !r[0])!;
            task.reject(`Some files failed to download. (e.g. ${url})`);
        }
        return results.every((r) => r);
    });
}

function configure() {
    const limit = opt().download.maxTasks;
    console.log('Max tasks for download: ' + limit);
    pool = new Pool(limit);
}

async function downloadSingleInBatched(p: DownloadProfile): Promise<boolean> {
    if (await checkForExistence(p)) {
        console.log('Fnd: ' + p.url);
        return true;
    }
    return await downloadFile(p);
}

// Check whether the target file already exists, matching the profile-specified checksum and size.
async function checkForExistence(prof: DownloadProfile): Promise<boolean> {
    if (!(await hasFile(prof.location))) {
        return false;
    }
    switch (prof.validation) {
        case '':
            return true;
        case 'size':
            if (prof.size < 0) {
                return true;
            } // Cannot check, assume correct
            try {
                const st = await stat(prof.location);
                return st.size == prof.size;
            } catch {
                return false;
            }
        default:
            if (!prof.checksum) {
                return true;
            }
            return await checkFileIntegrity(prof.location, prof.checksum, prof.validation);
    }
}
