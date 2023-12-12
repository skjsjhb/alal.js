import Strategies from '@/constra/strategies.json';
import { Container } from '@/modules/container/ContainerTools';
import { getRegTable } from '@/modules/data/Registry';
import { doesArrayOverlap } from '@/modules/util/Objects';
import { OSType } from '@/modules/util/OSType';
import { readdir } from 'fs-extra';
import path from 'path';

let containers: Record<string, Container>;
const containersRegId = 'containers';

/**
 * Gets a container.
 */
export function getContainer(id: string): Container | null {
    initOnDemand();
    return containers[id] ?? null;
}

/**
 * Adds a container.
 */
export function addContainer(id: string, c: Container): void {
    initOnDemand();
    containers[id] = c;
    console.log('Added container ' + c.rootDir);
}

/**
 * Removes a container from the registry, while keeping its files untouched.
 */
export function unlink(id: string): void {
    initOnDemand();
    delete containers[id];
}

/**
 * Tries to import a container with given path. Returns built object if container is found.
 *
 * Generated containers are always with properties `locked: false, shared: false` and `isolated` defined
 * by the check results.
 */
export async function importContainer(t: string): Promise<Container | null> {
    if (await isLikelyContainer(t)) {
        console.log('Found possible container at ' + t);
        return new Container({
            rootDir: t,
            locked: false,
            shared: false,
            isolated: await isLikelyIsolated(t)
        });
    }
    return null;
}

// Checks if the given container path is possibly isolated (usually contains `saves` directory in `versions`)
async function isLikelyIsolated(t: string): Promise<boolean> {
    try {
        const vdirs = await readdir(path.join(t, 'versions'));
        for (const profile of vdirs) {
            const vpath = path.join(t, 'versions', profile);
            const dirs = await readdir(vpath);
            if (doesArrayOverlap(dirs, Strategies.containerDetection.isolatedTraits)) {
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
}

// Checks if the target location is probably a container where a game has launched once.
async function isLikelyContainer(t: string): Promise<boolean> {
    try {
        const dirs = await readdir(t);
        return (
            (dirs.includes('assets') || dirs.includes('resources')) &&
            dirs.includes('libraries') &&
            dirs.includes('versions')
        );
    } catch {
        return false;
    }
}

/**
 * Gets default location of the game container.
 */
export function getDefaultContainerPath(): string {
    switch (OSType.self()) {
        case OSType.WINDOWS:
            if (!process.env['APPDATA']) {
                return '';
            }
            return path.join(process.env['APPDATA'], '.minecraft');
        case OSType.MACOS:
            if (!process.env['HOME']) {
                return '';
            }
            return path.join(process.env['HOME'], '/Library/Application Support/minecraft');
        case OSType.LINUX:
            if (!process.env['HOME']) {
                return '';
            }
            return path.join(process.env['HOME'], '.minecraft');
    }
    return '';
}

function initOnDemand() {
    if (!containers) {
        containers = getRegTable<Record<string, Container>>(containersRegId, {});
    }
}
