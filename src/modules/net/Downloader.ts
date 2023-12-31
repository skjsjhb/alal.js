/**
 * Builtin file downloader.
 *
 * This module runs on the main process, but all methods are also compatible for renderer use.
 */
import { checkFileIntegrity } from '@/modules/data/Files';
import { opt } from '@/modules/data/Options';
import { addCache, applyCache, removeCache } from '@/modules/net/Cacher';
import { applyMirrors } from '@/modules/net/Mirrors';
import { getProxyAgent } from '@/modules/net/ProxyMan';
import { createWriteStream, ensureDir, stat } from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';
import { PassThrough, Transform, TransformCallback } from 'stream';
import { pipeline } from 'stream/promises';

/**
 * The profile to tell downloader how to get the files.
 */
export interface DownloadProfile {
    url: string;
    origin: string; // Original URL for fallbacks
    location: string;
    headerTimeout: number;
    minSpeed: number;
    tries: number;
    cache: boolean;
    size: number;
    validation: string; // See method 'validateFile'
    checksum: string;
}

/**
 * Create download profile from several user-specified fields.
 */
export function createDownload(p: {
    url: string; // Mandatory
    location: string; // Mandatory
    headerTimeout?: number;
    minSpeed?: number;
    tries?: number;
    cache?: boolean;
    size?: number;
    checksum?: string;
    validation?: string;
    mirror?: boolean; // Whether to apply mirror the url
}): DownloadProfile {
    const { url, location, headerTimeout, minSpeed, tries, cache, size, checksum, validation, mirror } = p;
    let effectiveURL = url;
    if (mirror ?? true) {
        // Enabled by default
        effectiveURL = applyMirrors(effectiveURL);
    }
    return {
        url: effectiveURL,
        origin: url,
        location: location,
        headerTimeout: headerTimeout ?? opt().download.timeout,
        minSpeed: minSpeed ?? opt().download.minSpeed,
        tries: tries || opt().download.tries,
        cache: cache ?? false, // Cache is not enabled by default
        size: size ?? -1,
        checksum: checksum ?? '',
        validation: validation ?? 'size'
    };
}

/**
 * Download a file with cache checking, checksum validating and retries.
 */
export async function downloadFile(p: DownloadProfile): Promise<boolean> {
    let usingCache = true;
    const tries = p.tries;
    for (const _i of Array(tries)) {
        let err = null;
        if (!(await checkDownloadCache(p))) {
            usingCache = false;
            // Download file since cache not found
            err = await webGetFile(p);
        }
        if (!err) {
            console.log('Chk: ' + p.url);
            if (await validateDownload(p)) {
                await addDownloadCache(p);
                console.log('Got: ' + p.url);
                return true;
            }
        }
        // Has error
        if (usingCache) {
            // This cache is invalid
            await removeCache(p.url);
        }
        p.url = p.origin; // Disable mirrors
        // Try again
        console.log('Try: ' + p.url);
    }
    // You failed!
    console.warn('Drp: ' + p.url);
    return false;
}

// Validates the downloaded file using specified validation method
// The value of `validation` can be: `size`, empty string or a hash algorithm.
// `size`: Only check the size of the file
// Empty: Do not check the file
// Other: Treated as a hash algorithm name
// This method is controlled by global settings.
async function validateDownload(p: DownloadProfile): Promise<boolean> {
    if (!p.validation) {
        return true; // Always pass
    }
    if (p.validation == 'size') {
        if (p.size <= 0) {
            return true; // Size unknown, cannot check, assume pass
        }
        try {
            return (await stat(p.location)).size == p.size;
        } catch (e) {
            console.error('Could not stat file: ' + e);
            return false;
        }
    }
    if (!p.checksum) {
        return true; // No validation available
    }
    return await checkFileIntegrity(p.location, p.checksum, p.validation);
}

// Check the cache and apply if applicable
async function checkDownloadCache(p: DownloadProfile): Promise<boolean> {
    if (!opt().download.cache || !p.cache) {
        return false; // Disabled by caller or global settings
    }
    if (await applyCache(p.url, p.location)) {
        console.log('Hit: ' + p.url);
        return true;
    }
    return false;
}

// Adds file to cache. This method is controlled by global settings.
async function addDownloadCache(p: DownloadProfile): Promise<void> {
    if (!opt().download.cache || !p.cache) {
        return;
    }
    await addCache(p.url, p.location);
}

/**
 * Download a file. Returns the error message (status code for non-ok requests and describing message for others).
 *
 * @returns Whether the operation is successful.
 * @param p Download profile.
 */
export async function webGetFile(p: DownloadProfile): Promise<string | null> {
    const { url, location, headerTimeout, minSpeed } = p;
    console.log('Get: ' + url);

    const timeoutController = new AbortController();
    const tlc = setTimeout(() => {
        timeoutController.abort('Timeout');
    }, headerTimeout);

    try {
        const res = await fetch(url, {
            signal: timeoutController.signal,
            agent: await getProxyAgent(url)
        });
        if (!res.ok) {
            return res.status.toString();
        }
        if (!res.body) {
            return 'Empty body';
        }
        // Remove timeout on header received
        clearTimeout(tlc);
        const meter = getSpeedMeter(minSpeed);
        await ensureDir(path.dirname(location));
        await pipeline(res.body, meter, createWriteStream(location));
        console.log('Res: ' + url);
        return null;
    } catch (e) {
        console.log(`Err: ${url} (${e})`);
        return String(e);
    }
}

const meterInterval = 3000;
// Creates a speed meter transform stream. The input chunk is simply forwarded to the output, but an error
// is thrown if the speed is below the minimum.
// The return value contains a created stream and a timer. The latter should be cancelled on pipe complete.
function getSpeedMeter(minSpeed: number): Transform {
    if (minSpeed <= 0) {
        return new PassThrough();
    }
    let size = 0;
    const tld = setInterval(() => {
        if (size < (minSpeed * meterInterval) / 1000) {
            tr.emit('error', new Error('Speed below minimum'));
        } else {
            size = 0;
        }
    }, meterInterval);
    const tr = new Transform({
        transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback) {
            size += Buffer.from(chunk).length;
            callback(null, chunk);
        },
        destroy(_error: Error | null, callback: (error: Error | null) => void) {
            clearInterval(tld);
            // Errors are ignored for meter
            callback(null);
        }
    });
    return tr;
}
