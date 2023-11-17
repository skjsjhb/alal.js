import fs from "fs-extra";
import path from "path";
import { isFileExist } from "../commons/FileUtil";
import { getBasePath } from "../config/PathSolve";
import { getContainer, registerContainer, unregisterContainer } from "./ContainerUtil";
import { MinecraftContainer } from "./MinecraftContainer";

// Create a container at specified dir
export async function createNewContainer(
    rootDir: string,
    name: string,
    isASC = false
): Promise<void> {
    if (path.resolve(rootDir) === getBasePath()) {
        throw new Error("Invalid target! Cannot operate cwd.");
    }
    let stat;
    const d = path.resolve(rootDir);
    try {
        try {
            stat = await fs.stat(d);
        } catch {
            await fs.ensureDir(d);
            registerContainer(new MinecraftContainer(d, name));
            return;
        }
    } catch (e) {
        throw new Error("Cannot create container. Caused by: " + e);
    }
    if (!stat?.isDirectory()) {
        throw new Error("Invalid target! Target is not a directory.");
    } else {
        registerContainer(new MinecraftContainer(d, name));
    }
}

// Unlink a container, don't delete
export function unlinkContainer(name: string): void {
    unregisterContainer(name);
}

export async function forkContainer(c: MinecraftContainer): Promise<void> {
    let pt = c.rootDir + "_fork";
    while (await isFileExist(pt)) {
        pt += "_fork";
    }

    await fs.ensureDir(pt);
    await fs.copy(c.rootDir, pt);
}

// Remove files, don't unlink
export async function clearContainer(name: string): Promise<void> {
    const dir = getContainer(name).resolvePath();
    if (dir === getBasePath()) {
        throw new Error("Invalid target! Cannot operate cwd.");
    }
    try {
        await fs.emptydir(dir);
    } catch (e) {
        throw new Error("Cannot delete container. Caused by: " + e);
    }
}
