import { Availa } from "@/modules/util/Availa";
import { createReadStream, createWriteStream, readFile, writeFile } from "fs-extra";
import type LZMA from "lzma-native";
import { pipeline } from "stream/promises";

/**
 * Compression util module.
 */
export module Compressing {
    let lzma: typeof LZMA;
    let lzmaSoft: LZMASoft;

    interface LZMASoft {
        decompress: (data: Buffer, callback: (data: Buffer, error: any) => void) => void;
    }

    /**
     * Decompress a lzma archive.
     */
    export async function decompressLZMA(src: string, target: string): Promise<boolean> {
        try {
            if (!Availa.supports("lzma-native")) {
                // Use a software implementation
                if (!lzmaSoft) {
                    console.warn("Native implementation of LZMA is not available. A software implementation is used.");
                    console.warn("Note: This can bring heavy performance impact for large files.");
                    // @ts-ignore
                    lzmaSoft = (await import("lzma/src/lzma_worker") as { LZMA_WORKER: LZMASoft }).LZMA_WORKER;
                }
                const buf = await readFile(src);
                await new Promise((res, rej) => {
                    lzmaSoft.decompress(buf, (data, error) => {
                        if (error) {
                            rej(error);
                        } else {
                            res(Buffer.from(data));
                        }
                    });
                });
                await writeFile(target, buf);
            } else {
                if (!lzma) {
                    lzma = await import("lzma-native");
                }
                const stream = lzma.createDecompressor();
                await pipeline(createReadStream(src), stream, createWriteStream(target));
            }
            console.log("Inflated: " + src);
            return true;
        } catch (e) {
            console.error("Could not decompress LZMA " + src + ": " + e);
            return false;
        }
    }
}