import os from "os";

/**
 * The type of supported OS.
 *
 * Mojang officially supports only these three platforms, when porting for others, modifications are needed.
 */
export enum OSType {
    WINDOWS = "windows",
    MACOS = "macos",
    LINUX = "linux"
}

export namespace OSInfo {
    /**
     * Make the input raw os name string canonical.
     *
     * This method accept aliases of os types. e.g. `osx` will be `MACOS`, etc.
     */
    export function fromString(src: string): OSType {
        src = src.toLowerCase();
        if (src == "osx" || src == "macos") {
            return OSType.MACOS;
        }
        if (src == "windows" || src == "win32" || src == "win64") {
            return OSType.WINDOWS;
        }
        if (src == "linux") {
            return OSType.LINUX;
        }
        if (src.includes("darwin")) {
            return OSType.MACOS;
        }
        if (src.includes("win")) {
            return OSType.WINDOWS;
        }
        return OSType.LINUX;
    }

    /**
     * Returns the type of current OS.
     */
    export function getSelf(): OSType {
        switch (os.platform()) {
            case "darwin":
                return OSType.MACOS;
            case "win32":
                return OSType.WINDOWS;
            default:
                return OSType.LINUX;
        }
    }
}