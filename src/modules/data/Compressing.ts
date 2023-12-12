import { alSupports } from '@/modules/util/Availa';
import { createReadStream, createWriteStream } from 'fs-extra';
import type LZMA from 'lzma-native';
import { pipeline } from 'stream/promises';

/**
 * Compression util module.
 */

let lzma: typeof LZMA;

/**
 * Decompress a lzma archive.
 */
export async function decompressLZMA(src: string, target: string): Promise<boolean> {
    try {
        if (!alSupports('lzma-native')) {
            console.error('Could not decompress, LZMA is not supported for this build.');
            return false;
        } else {
            if (!lzma) {
                lzma = await import('lzma-native');
            }
            const stream = lzma.createDecompressor();
            await pipeline(createReadStream(src), stream, createWriteStream(target));
        }
        console.log('Inflated: ' + src);
        return true;
    } catch (e) {
        console.error('Could not decompress LZMA ' + src + ': ' + e);
        return false;
    }
}
