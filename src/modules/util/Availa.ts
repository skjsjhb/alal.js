import { ipcRenderer } from 'electron';
import os from 'os';
import FeatureMatrix from 'R/build/feature-matrix.json';

/**
 * Check for the availability of certain features.
 */
export module Availa {
    const platform = os.platform() + '-' + os.arch();
    let featureSet: Set<string>;

    interface FeatureMatrixItem {
        enable: boolean,
        platform: string,
        value: string[]
    }

    /**
     * Check whether certain feature is enabled.
     */
    export function supports(name: string): boolean {
        if (!featureSet) {
            featureSet = new Set();
            synthensisFeatures();
        }
        return featureSet.has(name);
    }

    /**
     * Check if the current process is a renderer process.
     */
    export function isRemote(): boolean {
        return !!ipcRenderer;
    }

    function synthensisFeatures() {
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
}