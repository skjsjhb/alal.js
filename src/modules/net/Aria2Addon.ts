import { Files } from "@/modules/data/Files";
import { Options } from "@/modules/data/Options";
import { Paths } from "@/modules/data/Paths";
import { DownloadProfile } from "@/modules/net/Downloader";
import { Availability } from "@/modules/util/Availability";
import { Throttle } from "@/modules/util/Throttle";
import { ChildProcess, exec, spawn } from "child_process";
import { remove } from "fs-extra";
import getPort from "get-port";
import os from "os";
import path from "path";
import * as uuid from "uuid";

/**
 * A module to support aria2 downloading.
 */
export namespace Aria2Addon {
    let aria2cExec: string;
    let aria2cProc: ChildProcess | null;
    let aria2: WebSocket | null;
    let aria2Port: number | null;

    export async function configure() {
        if (Options.get().download.aria2.enabled) {
            console.log("Configuring aria2c.");
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
        aria2 && (aria2.onclose = () => {});
        aria2 = null;
    }

    const messageSubscribeMap: Map<string, (s: any) => void> = new Map();

    async function spawnProc(): Promise<boolean> {
        return new Promise(async (res) => {
            const timeoutId = setTimeout(() => {
                console.error("Spawn aria2c timed out!");
                res(false);
            }, 5000);
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
                    aria2cProc.once("spawn", onAria2Spawn);
                    aria2cProc.once("exit", onAria2Exit);
                    if (Options.get().dev) {
                        aria2cProc.stdout?.pipe(process.stdout);
                        aria2cProc.stderr?.pipe(process.stderr);
                    }
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
                    await openAria2Connection();
                    res(true);
                    clearTimeout(timeoutId);
                } catch (e) {
                    console.error("Could not connect to aria2: " + e);
                    stopProc();
                    res(false);
                    clearTimeout(timeoutId);
                }
            }

            function onAria2Exit() {
                console.error("Unexpected exit of aria2c. This might cause further errors.");
                aria2cProc = null;
                aria2 = null;
            }
        });
    }

    async function openAria2Connection(): Promise<void> {
        return new Promise((res, rej) => {
                aria2 = new WebSocket("ws://localhost:" + aria2Port + "/jsonrpc");
                bindListeners();
                aria2.addEventListener("open", async () => {
                    const s = await sendRPCMessage({
                        method: "aria2.getVersion"
                    });
                    if (s?.result?.version) {
                        res();
                        console.log("Connected to aria2 version " + s?.result?.version);
                    } else {
                        rej();
                        console.error("Malformed result from aria2: " + s);
                    }
                });

                aria2.addEventListener("error", (e) => {
                    console.error("Error during WebSocket transmission: " + e.type);
                });

                aria2.onclose = async (e) => {
                    console.error("Unexpected close of aria2c WebSocket: " + e.code + " " + e.reason);
                    console.log("Trying to reopen connection.");
                    try {
                        await openAria2Connection();
                    } catch (e) {
                        console.error("Could not reopen connection. I'm closing.");
                        stopProc();
                    }
                };
            }
        );


    }

    async function sendRPCMessage(data: any): Promise<any> {
        return new Promise((res) => {
            if (!aria2) {
                res(null);
                return;
            }
            const timeout = setTimeout(() => {
                console.error("Connect to aria2c timed out!");
                res(null);
            }, 5000);
            const mid = uuid.v4();
            messageSubscribeMap.set(mid, (s) => {
                messageSubscribeMap.delete(mid);
                clearTimeout(timeout);
                res(s);
            });
            aria2.send(JSON.stringify(Object.assign({
                jsonrpc: "2.0",
                id: mid
            }, data)));
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
        aria2.addEventListener("message", (e) => {
            try {
                const obj = JSON.parse(e.data);
                if (obj.id) {
                    // Response
                    const fn = messageSubscribeMap.get(obj.id);
                    if (fn) {
                        fn(obj);
                    }
                } else if (obj.method) {
                    // Notification
                    const gids: string[] = obj.params.map((o: any) => o?.gid || "");
                    switch (obj.method) {
                        case "aria2.onDownloadComplete":
                            gids.forEach((gid) => {
                                pendingResolvers.get(gid)?.(true);
                                pendingResolvers.delete(gid);
                            });
                            break;
                        case "aria2.onDownloadError":
                        case "aria2.onDownloadStop":
                            gids.forEach((gid) => {
                                pendingResolvers.get(gid)?.(false);
                                pendingResolvers.delete(gid);
                            });
                            break;
                    }
                }
            } catch (e) {
                console.error("Invalid aria2c incoming message received: " + e);
            }
        });
    }

    const pollingInterval = 1000;
    const wsPoll = new Throttle.Pool(8);

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
                await wsPoll.acquire();
                const s = await sendRPCMessage({
                    method: "aria2.addUri",
                    params: [[p.url], {
                        dir: path.dirname(p.location),
                        out: path.basename(p.location),
                        "connect-timeout": (Options.get().download.timeout || 5000) / 1000
                    }]
                });
                wsPoll.release();
                const gid = s.result;
                if (!gid) {
                    console.error("Malformed GID returned by aria2: " + gid);
                    res(false);
                    return;
                }
                const polling = setInterval(async () => {
                    const state = await sendRPCMessage({
                        method: "aria2.tellStatus",
                        params: [gid, ["status"]]
                    });
                    if (state == null) {
                        clearInterval(polling);
                        console.error("Connection to aria2 has lost!");
                        res(false);
                    }
                    const s = state?.result?.status;
                    if (s == "active" || s == "waiting") {
                        // This is acceptable
                        return;
                    }
                    if (s == "complete") {
                        clearInterval(polling);
                        res(true);
                    } else {
                        console.error("Invalid status for " + gid + ", aria2c status cannot be " + s);
                        res(false); // No paused, error or removed allowed
                    }
                }, pollingInterval);
                pendingResolvers.set(gid, res);
            } catch (e) {
                console.error("Error during aria2c request: " + e);
                res(false);
            }
        });

    }
}