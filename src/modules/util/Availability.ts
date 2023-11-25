import os from "os";
import FeatureMatrix from "R/build/feature-matrix.json";

/**
 * Check for the availability of certain features.
 */
export namespace Availability {
    const platform = os.platform() + "-" + os.arch();
    const featureSet: Set<string> = new Set();

    interface FeatureMatrixItem {
        enable: boolean,
        platform: string,
        value: string[]
    }

    export function synthensisFeatures() {
        for (const i of FeatureMatrix as FeatureMatrixItem[]) {
            if (new RegExp(i.platform).test(platform)) {
                if (i.enable) {
                    for (const j of i.value) {
                        featureSet.add(j);
                    }
                } else {
                    for (const j of i.value) {
                        featureSet.delete(j);
                    }
                }
            }

        }
    }

    /**
     * Check whether certain feature is enabled.
     */
    export function supports(name: string): boolean {
        return featureSet.has(name);
    }
}