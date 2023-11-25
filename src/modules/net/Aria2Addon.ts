import { Files } from "@/modules/data/Files";
import { Options } from "@/modules/data/Options";
import { Paths } from "@/modules/data/Paths";
import { DownloadProfile } from "@/modules/net/Downloader";
import { Availability } from "@/modules/util/Availability";
import { ChildProcess, exec, spawn } from "child_process";
import { remove } from "fs-extra";
import getPort from "get-port";
import { WebSocket as Aria2WS } from "libaria2";
import os from "os";
import path from "path";

/**
 * A module to support aria2 downloading.
 */
export namespace Aria2Addon {
    let aria2cExec: string;
    let aria2cProc: ChildProcess | null;
    let aria2: Aria2WS.Client | null;
    let aria2Port: number | null;

    export async function configure() {
        if (Options.get().download.aria2.enabled) {
            if (await checkExecutable()) {
                await spawnProc();
            }
        }
    }

    /**
     * Find and check the availability of aria2c(.exe).
     */
    async function checkExecutable(): Promise<boolean> {
        console.log("Checking for availability of aria2c.");
        if (Availability.supports("bundled-aria2c")) {
            let execPath;
            if (os.platform() == "win32") {
                execPath = Paths.getResourcePath("addons/aria2c.exe");
            } else {
                execPath = Paths.getResourcePath("addons/aria2c");
            }
            if (await Files.exists(execPath)) {
                console.log("Found aria2c: " + execPath);
                aria2cExec = execPath;
                return true;
            }
        } else {
            const b = await new Promise((res) => {
                exec("aria2c -v", (e) => {
                    if (e) {
                        res(false);
                    } else {
                        res(true);
                    }
                });
            });
            if (b) {
                console.log("Found aria2c in path.");
                aria2cExec = "aria2c";
                return true;
            }

        }
        console.log("Could not find aria2c with this release.");
        return false;
    }

    export function stopProc(): void {
        aria2cProc?.removeAllListeners("exit");
        aria2cProc?.kill();
        aria2cProc = null;
    }

    async function spawnProc(): Promise<boolean> {
        return new Promise(async (res) => {
            if (aria2cExec) {
                try {
                    aria2Port = await getPort();
                    console.log("Spawning aria2c process on port " + aria2Port + " using " + aria2cExec);
                    const maxConcurrent = Options.get().download.aria2.maxConcurrent || 32;
                    const minSplitSize = Options.get().download.aria2.minSplitSize || "10M";
                    aria2cProc = spawn(aria2cExec,
                        ["--enable-rpc=true",
                            "--rpc-listen-port=" + aria2Port,
                            "--max-connection-per-server=16",
                            "--max-concurrent-downloads=" + maxConcurrent,
                            "--min-split-size=" + minSplitSize,
                            "--allow-overwrite=true",
                            "--optimize-concurrent-downloads=true",
                            "--auto-file-renaming=false"
                        ]);
                    aria2cProc.on("spawn", onAria2Spawn);
                    aria2cProc.once("exit", onAria2Exit);
                } catch (e) {
                    console.error("Could not spawn aria2c process: " + e);
                    res(false);
                }
            } else {
                console.error("Executable for aria2c is not available on this platform.");
                res(false);
            }

            async function onAria2Spawn() {
                try {
                    console.log("Spawned aria2c process. Setting up connection.");
                    aria2 = new Aria2WS.Client({
                        port: aria2Port as number, /* auth: {secret: aria2cSecret}, */ host: "localhost"
                    });
                    const version = await aria2.getVersion();
                    bindListeners();
                    console.log("Connected to aria2 version " + version.version);
                    res(true);
                } catch (e) {
                    console.error("Could not connect to aria2: " + e);
                    aria2cProc?.removeAllListeners("exit");
                    aria2cProc?.kill();
                    aria2cProc = null;
                    aria2 = null;
                    res(false);
                }
            }

            function onAria2Exit() {
                console.error("Unexpected exit of aria2c. This might cause further errors.");
                aria2cProc = null;
                aria2 = null;
            }
        });
    }


    /**
     * Check for the existence of aria2c connection instance.
     */
    export function isPresent(): boolean {
        return Options.get().download.aria2.enabled && aria2cProc != null && aria2 != null;
    }

    const pendingResolvers: Map<string, (s: boolean) => any> = new Map();

    function bindListeners() {
        if (!aria2) {
            return;
        }
        console.log("Binding listeners for aria2c.");

        aria2.on("aria2.onDownloadComplete", async (e) => {
            const rsv = pendingResolvers.get(e.gid);
            if (rsv) {
                pendingResolvers.delete(e.gid);
                rsv(true);
            }
        });
        aria2.on("aria2.onDownloadError", async (e) => {
            const rsv = pendingResolvers.get(e.gid);
            if (rsv) {
                pendingResolvers.delete(e.gid);
                rsv(false);
            }
        });
    }

    /**
     * Aria2 version of {@link Downloader.webGetFile}.
     */
    export async function webGetFile(p: DownloadProfile): Promise<boolean> {
        return new Promise(async (res) => {
            try {
                if (!aria2) {
                    console.error("Aria2 process is not present.");
                    return false;
                }
                console.log("Get: " + p.url);
                await remove(p.location); // Preventing EEXIST
                const gid = await aria2.addUri(p.url, {
                    dir: path.dirname(p.location),
                    out: path.basename(p.location),
                    "connect-timeout": (Options.get().download.timeout || 5000) / 1000
                });
                pendingResolvers.set(gid, res);
            } catch (e) {
                console.error("Unexpected error during aria2c request: " + e);
                res(false);
            }
        });

    }
}