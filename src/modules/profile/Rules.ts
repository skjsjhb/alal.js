import { ProfileRule } from '@/modules/profile/VersionProfile';
import { OSInfo } from '@/modules/util/OSInfo';
import os from 'os';

/**
 * Profile rule solver.
 *
 * Resolving rules is a cumbersome work and contains many profile-unrelated code. They are seperated to here.
 */
export module Rules {
    export function resolveRules(rules?: ProfileRule[], features?: string[]): boolean {
        if (rules == undefined) {
            return true; // If rules are empty, then allow
        }
        // Caveat: empty ruleset (but not null) means disallow by default
        let allow = false;
        for (const r of rules) {
            let apply = true;
            if (r.os?.version) {
                apply &&= new RegExp(r.os.version).test(os.version());
            }
            if (r.os?.name) {
                apply &&= isMojangNamedOS(r.os.name);
            }
            if (r.os?.arch) {
                switch (r.os.arch) {
                    case 'x86':
                        apply &&= os.arch() == 'ia32';
                        break;
                }
            }
            if (r.features) {
                for (const [k, b] of Object.entries(r.features)) {
                    const present = features?.includes(k);
                    apply &&= (present && b || !present && !b);
                }
            }
            if (apply) {
                allow = r.action == 'allow';
            }
        }
        return allow;
    }

    function isMojangNamedOS(mojang: string): boolean {
        mojang = mojang.toLowerCase();
        if (mojang == 'osx' || mojang == 'macos') {
            return OSInfo.isMacOS();
        }
        if (mojang == 'windows') {
            return OSInfo.isWindows();
        }
        if (mojang == 'linux') {
            return OSInfo.isLinux();
        }
        return true;
    }
}