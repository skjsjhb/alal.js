import JREDownloadMatrix from "@/constra/jre-dl-matrix.json";
import { OSInfo } from "@/modules/sys/OSInfo";
import os from "os";

// TODO replace with jem - this is only a temporal replacement
export function getLatestJREURL(old = false): string {
    let plat = OSInfo.getSelf();
    let arch = "unknown";
    let ver = old ? "legacy" : "latest";
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
    return (JREDownloadMatrix as Record<string, string>)[k] || "";
}
