const { outputJSON } = require("fs-extra");
const path = require("path");

/**
 * Fetches version info from Mojang and generate a JSON overriding `src/constra/jre-map.json`.
 */
async function main() {
    console.log("Syncing Java component registry.");
    const output = {};
    const manifest = await fetchJSON("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json");
    await Promise.all((manifest.versions.map(async ({ url }) => {
        const profile = await fetchJSON(url);
        const comp = profile.javaVersion?.component;
        if (comp && comp !== "jre-legacy") { // Ignore jre-legacy as it's default
            console.log(profile.id + " -> " + comp);
            output[profile.id] = profile.javaVersion.component;
        }
    })));
    const keys = Object.keys(output);
    keys.sort();
    const output2 = {};
    for (const k of keys) {
        output2[k] = output[k];
    }
    const pt = path.resolve(__dirname, "..", "src", "constra", "jre-map.json");
    console.log("Writing output to " + pt);
    await outputJSON(pt, output2, { spaces: 4 });
}

let fetch;

async function fetchJSON(u) {
    if (!fetch) {
        fetch = (await import("node-fetch")).default;
    }
    const res = await fetch(u);
    return await res.json();
}

void main();