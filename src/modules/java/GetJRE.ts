import os from "os";
import JreDlMatrix from "../../constra/jre-dl-matrix.json";

export function getLatestJREURL(old = false): string {
    let plat = "unknown";
    let arch = "unknown";
    let ver = old ? "legacy" : "latest";
    switch (os.platform()) {
        case "win32":
            plat = "windows";
            break;
        case "darwin":
            plat = "macos";
            break;
        case "linux":
            plat = "linux";
            break;
    }
    switch (os.arch()) {
        case "x64":
        case "amd64":
            arch = "x64";
            break;
        case "aarch64":
        case "arm":
        case "arm64":
            arch = "arm";
    }
    const k = plat + "-" + arch + "-" + ver;
    return (JreDlMatrix as Record<string, string>)[k] || "";
}
