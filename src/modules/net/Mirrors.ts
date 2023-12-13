import OriginalRulesRaw from '@/constra/mirrors.json';
import { opt } from '@/modules/data/Options';
import { getRegTable } from '@/modules/data/Registry';
import { getProxyAgent } from '@/modules/net/ProxyMan';
import { repeat } from '@/modules/util/Objects';
import fetch from 'node-fetch';

/**
 * Mirrors latency test, resolve and management module.
 */
interface SourceRuleSet {
    test: string; // The URL to test latency
    overrides: Record<string, string | null>; // URL replacement rules
}

type GeneratedRuleSet = {
    name: string;
    speed: number;
} & SourceRuleSet;

const mirrorsRegId = 'mirrors_v2';
const originalRules = OriginalRulesRaw as Record<string, SourceRuleSet>;

const updatePeriod = 1000 * 60 * 60 * 24; // Update once per day

interface MirrorRecords {
    rules: GeneratedRuleSet[];
    lastUpdate: number;
}

/**
 * Tests the speed of specified mirror.
 */
export function testMirrorSpeed(name: string): Promise<number> {
    return testSpeed(originalRules[name].test);
}

// Synthesized rules with priority applied
let synthRules: Map<string, string | null>;

const latencyTestTries = 10;
const latencyTestTimeout = 20000; // 20s for a file around 1MiB

async function testSpeed(url: string): Promise<number> {
    const proxyAgent = await getProxyAgent(url);
    const results = await Promise.all(
        repeat(latencyTestTries).map(async () => {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort('Timeout'), latencyTestTimeout);
            try {
                const start = Date.now(); // Test speed for body
                const res = await fetch(url, { signal: controller.signal, agent: proxyAgent });
                const buf = Buffer.from(await res.arrayBuffer());
                clearTimeout(tid);
                return buf.length / (Date.now() - start); // Bytes per ms
            } catch (e) {
                console.log('Error during speed test: ' + e);
                return -1;
            }
        })
    );
    if (results.includes(-1)) {
        return -1;
    }
    return Math.round(results.reduce((a, b) => a + b) / results.length);
}

async function sortRules(ruleSet: Record<string, SourceRuleSet>): Promise<GeneratedRuleSet[]> {
    const rules = Object.entries(ruleSet);
    const genRules: GeneratedRuleSet[] = [];

    // Generate latency map
    await Promise.all(
        rules.map(async ([name, rule]) => {
            const speed = await testSpeed(rule.test);
            if (speed < 0) {
                console.warn(`Mirror ${name} unreachable, skipped.`);
                return;
            } else {
                console.log('Speed of %s: %d KB/s', name, (speed * 1000) / 1024);
            }
            genRules.push({
                ...rule,
                name,
                speed: speed
            });
        })
    );
    return genRules.sort((a, b) => a.speed - b.speed);
}

const defaultMirrorRec = {
    lastUpdate: -1,
    rules: []
};

/**
 * Update the mirror rules on demand by testing the speed and set the table value.
 * Note that this method will clear any previously set rules and use the new one.
 */
export async function updateMirrors() {
    const rec = getRegTable<MirrorRecords>(mirrorsRegId, defaultMirrorRec);
    if (rec.rules.length == 0 || rec.lastUpdate < Date.now() - updatePeriod) {
        console.log('Expired or missing mirror rules. Updating.');
        rec.rules = await sortRules(originalRules);
        rec.lastUpdate = Date.now();
        console.log('Updated mirror rules.');
    } else {
        console.log('Skipped up-to-date mirror testing.');
    }
}

function synthesizeRules() {
    synthRules = new Map();
    const rec = getRegTable<MirrorRecords>(mirrorsRegId, defaultMirrorRec);
    for (const rule of rec.rules) {
        for (const [k, v] of Object.entries(rule.overrides)) {
            synthRules.set(k, v);
        }
    }
}

/**
 * Applies mirrors to the specified url. If the url does not match any rules, the original version is returned.
 */
export function applyMirrors(url: string): string {
    if (!opt().download.allowMirror) {
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
