import { Signals } from "@/background/Signals";
import OriginalRulesRaw from "@/constra/mirrors.json";
import { Options } from "@/modules/data/Options";
import { Registry } from "@/modules/data/Registry";
import { ipcRenderer } from "electron";

/**
 * Mirrors latency test, resolve and management module.
 */
export namespace Mirrors {
    interface SourceRuleSet {
        test: string; // The URL to test latency
        overrides: Record<string, string | null>; // URL replacement rules
    }

    type GeneratedRuleSet = {
        name: string;
        latency: number;
    } & SourceRuleSet;

    const mirrorsRegId = "mirrors";
    const originalRules = OriginalRulesRaw as Record<string, SourceRuleSet>;

    /**
     * Tests the latency of specified mirror.
     */
    export function testMirrorLatency(name: string): Promise<number> {
        return testLatency(originalRules[name].test);
    }

    // Synthesized rules with priority applied
    let synthRules: Map<string, string | null>;

    // Tests the header latency and returns in ms.
    // This method also considers stability - an error will cause latency test to fail.
    // Can only be called on the renderer process.
    function testLatency(url: string): Promise<number> {
        return ipcRenderer.invoke(Signals.TEST_LATENCY, url);
    }

    async function sortRulesByLatency(ruleSet: Record<string, SourceRuleSet>): Promise<GeneratedRuleSet[]> {
        const rules = Object.entries(ruleSet);
        const genRules: GeneratedRuleSet[] = [];

        console.log("Updating mirror latency. This may take several seconds.");
        // Generate latency map
        await Promise.all(rules.map(async ([name, rule]) => {
            const latency = await testLatency(rule.test);
            if (latency < 0) {
                console.warn(`Mirror ${name} unreachable, skipped.`);
                return;
            } else {
                console.log("Latency of " + name + ": " + latency + " ms");
            }
            genRules.push({
                ...rule,
                name, latency
            });
        }));
        return genRules.sort((a, b) => a.latency - b.latency);
    }

    /**
     * Update the mirror rules by testing the latency and set the table value.
     * Note that this method will clear any previously set rules and use the new one.
     * Mirrors are updates regardless of whether it's enabled.
     */
    export async function updateRules() {
        const res = await sortRulesByLatency(originalRules);
        Registry.setTable(mirrorsRegId, res);
        console.log("Saved mirror rules.");
    }

    function synthesizeRules() {
        synthRules = new Map();
        const rules = Registry.getTable<GeneratedRuleSet[]>(mirrorsRegId, []);
        for (const rule of rules.toReversed()) {
            for (const [k, v] of Object.entries(rule.overrides)) {
                synthRules.set(k, v);
            }
        }
    }

    /**
     * Applies mirrors to the specified url. If the url does not match any rules, the original version is returned.
     */
    export function apply(url: string): string {
        if (!Options.get().download.allowMirror) {
            return url;
        }
        if (!synthRules) {
            synthesizeRules();
        }
        for (const [a, b] of synthRules) {
            if (url.includes(a)) {
                if (b == null) {
                    return url; // Null means keep as-is
                }
                return url.replace(a, b); // Apply rule only once
            }
        }
        return url; // No rule found
    }
}