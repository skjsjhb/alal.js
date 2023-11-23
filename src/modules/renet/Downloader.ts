import { Signals } from "@/background/Signals";
import { ipcRenderer } from "electron";
import fetch from "electron-fetch";
import { createWriteStream, ensureDir } from "fs-extra";
import path from "path";
import { PassThrough, Transform, TransformCallback } from "stream";
import { pipeline } from "stream/promises";

/**
 * Builtin file downloader.
 *
 * This module runs on the main process, but all methods are also compatible for renderer use.
 */
export namespace Downloader {
    // Creates a speed meter transform stream. The input chunk is simply forwarded to the output, but an error
    // is thrown if the speed is below the minimum.
    // The return value contains a created stream and a timer. The latter should be cancelled on pipe complete.
    function getSpeedMeter(minSpeed: number): Transform {
        if (minSpeed <= 0) {
            return new PassThrough();
        }
        let size = 0;
        const tld = setInterval(() => {
            if (size < minSpeed) {
                tr.emit("error", new Error("Speed below minimum"));
            }
        }, 1000);
        const tr = new Transform({
            transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback) {
                size += Buffer.from(chunk).length;
                callback(null, chunk);
            },
            destroy(_error: Error | null, callback: (error: (Error | null)) => void) {
                clearInterval(tld);
                // Errors are ignored for meter
                callback(null);
            }
        });
        return tr;
    }

    /**
     * Download a file.
     * @param url Source url.
     * @param location Target path.
     * @param headerTimeout Timeout for header response.
     * @param minSpeed Minimum speed in bytes.
     *
     * @returns Whether the operation is successful.
     */
    export async function webGetFile(url: string, location: string, headerTimeout: number, minSpeed: number): Promise<boolean> {
        console.log("Get: " + url);
        let err;
        if (ipcRenderer) {
            err = await webGetFileRemote(url, location, headerTimeout, minSpeed);
        } else {
            err = await webGetFileMain(url, location, headerTimeout, minSpeed);
        }
        if (err == null) {
            console.log("Got: " + url);
            return true;
        } else {
            console.log(`Err: ${url} (${err})`);
            return false;
        }
    }

    // Wrapped remote version
    export async function webGetFileRemote(url: string, location: string, headerTimeout: number, minSpeed: number): Promise<string | null> {
        return await ipcRenderer.invoke(Signals.WEB_GET_FILE, url, location, headerTimeout, minSpeed);
    }

    // Download a file using electron-fetch in main process
    // Returns the error message, or `null` if successful.
    export async function webGetFileMain(url: string, location: string, headerTimeout: number, minSpeed: number): Promise<string | null> {
        const timeoutController = new AbortController();
        const tlc = setTimeout(() => {
            timeoutController.abort("Timeout");
        }, headerTimeout);
        try {
            const res = await fetch(url, {
                signal: timeoutController.signal
            });
            if (!res.ok) {
                return "Status " + res.status;
            }
            if (!res.body) {
                return "Empty body";
            }
            // Remove timeout on header received
            clearTimeout(tlc);
            const meter = getSpeedMeter(minSpeed);
            await ensureDir(path.dirname(location));
            await pipeline(res.body, meter, createWriteStream(location));
            return null;
        } catch (e) {
            return String(e);
        }
    }
}