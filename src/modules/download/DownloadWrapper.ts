import { getModifiedDate, isFileExist } from "../commons/FileUtil";
import { getNumber } from "../config/ConfigSupport";
import { deleteRecord, getLastValidateModified, updateRecord } from "../container/ValidateRecord";
import { DownloadMeta, DownloadStatus } from "./AbstractDownloader";
import { validate } from "./Validate";

const DOING_X_SUBSCRIBES: Map<string, (d: string) => unknown> = new Map();

export function addDoing(s: string): void {
    console.log(s);
    for (const [_n, f] of DOING_X_SUBSCRIBES) {
        void requestIdleCallback(() => {
            return Promise.resolve(f(s));
        });
    }
}


/**
 * @deprecated
 */
export async function wrappedDownloadFile(
    meta: DownloadMeta,
    noAutoLn = false,
    disableMirror = false
): Promise<DownloadStatus> {
    throw "Not implemented";
}

async function existsAndValidate(meta: DownloadMeta): Promise<boolean> {
    return await _existsAndValidate(meta.savePath, meta.sha1);
}

export async function existsAndValidateRaw(
    pt: string,
    sha1: string
): Promise<boolean> {
    return await _existsAndValidate(pt, sha1);
}

// Cached file validate
// If no sha provided, we'll ignore it
async function _existsAndValidate(
    pt: string,
    sha1: string,
    size = 0
): Promise<boolean> {
    if (!(await isFileExist(pt))) {
        deleteRecord(pt);
        return false;
    }
    if (sha1.trim() === "") {
        // This might be a wrong SHA, we should not cache it
        return true;
    }
    /* if (getBoolean("download.skip-validate")) {
      return await sizeValidate(pt, size);
    } */
    const lastValidated = getLastValidateModified(pt);
    const actualModifiedDate = await getModifiedDate(pt);
    if (actualModifiedDate <= lastValidated) {
        return true;
    }
    const res = await validate(pt, sha1, size); // We can accept the result of sizeValidate
    if (res) {
        updateRecord(pt);
    } else {
        deleteRecord(pt);
    }
    return res;
}

const PFF_FLAG = "Downloader.IsPff";

export function getPffFlag(): string {
    return sessionStorage.getItem(PFF_FLAG) || "0";
}

export function getConfigOptn(name: string, def: number): number {
    if (getPffFlag() === "1") {
        return (
            getNumber("download.pff." + name, 0) ||
            getNumber("download.concurrent." + name, def)
        );
    } else {
        return getNumber("download.concurrent." + name, def);
    }
}

