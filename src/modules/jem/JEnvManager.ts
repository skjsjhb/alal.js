import JavaSearchPaths from "@/constra/jre-search-paths.json";
import { Registry } from "@/modules/redata/Registry";
import { OSInfo } from "@/modules/sys/OSInfo";
import childProcess, { ExecFileException } from "child_process";
import { glob } from "glob";

/**
 * JRE env manager.
 */
export namespace JEnvManager {
    const jemRegId = "jem";

    /**
     * Describes a single JRE environment.
     */
    interface JREProfile {
        executable: string; // Path to the executable file
        javaVersion: number; // Java language spec, -1 for unknown
    }

    function addProfile(p: JREProfile) {
        Registry.getTable<JREProfile[]>(jemRegId, []).push(p);
        console.log("Added JRE version " + p.javaVersion + " at " + p.executable);
    }

    // Parse version from props string
    function parseVersion(props: string): number {
        // Safari does not support full regexp syntax, this one is more generic
        const versionLine = props.match(/java\.version = \S+/i);
        if (!versionLine) {
            return -1;
        }
        const versionString = versionLine[0]?.split("=")[1]?.trim();
        if (!versionString) {
            return -1;
        }
        const parts = versionString.split(".");
        if (parts[0] == "1") {
            const possibleVersion = parseInt(parts[1]);
            if (possibleVersion <= 8) {
                return possibleVersion;
            }
        }
        return parseInt(parts[0]);
    }

    // Retrieves JRE version spec and creates a profile.
    function buildJavaProfile(exec: string): Promise<JREProfile> {
        return new Promise((res, rej) => {
            childProcess.execFile(exec, ["-XshowSettings:properties", "-version"], onComplete);

            function onComplete(e: ExecFileException | null, _stdout: string, stderr: string) {
                if (e) {
                    rej("Error spawning java process: " + e);
                    return;
                }
                const ver = parseVersion(stderr);
                if (ver == -1 || isNaN(ver)) {
                    rej("Could not parse java version.");
                    return;
                }
                res({
                    executable: exec,
                    javaVersion: ver
                });
            }
        });

    }

    // Search using glob
    async function searchJavaPaths(): Promise<string[]> {
        const paths = JavaSearchPaths[OSInfo.getSelf()];
        if (!paths) {
            console.error("This platform does not support java path searching.");
            return [];
        }
        return await glob(paths, {
            absolute: true,
            nodir: true,
            realpath: true
        });
    }

    /**
     * Finds all JREs using a predefined path set, retrieves version info, then adds them to the JEM list.
     */
    export async function searchAndUpdate(): Promise<void> {
        console.log("Searching for JREs.");
        const paths = await searchJavaPaths();
        const promos = [];
        for (const p of paths) {
            promos.push(buildJavaProfile(p).then(addProfile).catch(console.error));
        }
        await Promise.allSettled(promos);
    }
}