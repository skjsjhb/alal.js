const { outputJSON } = require('fs-extra');
const path = require('path');

/**
 * Fetches version info from Mojang and generate a JSON overriding `src/constra/jre-map.json` and `src/constra/version-names.json`.
 */
async function main() {
    console.log('Syncing Java component registry and Mojang version names.');
    const jreMap = {};
    const versionNames = [];
    const manifest = await fetchJSON('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
    await Promise.all(
        manifest.versions.map(async ({ id, url }) => {
            versionNames.push(id);
            const profile = await fetchJSON(url);
            const comp = profile.javaVersion?.component;
            if (comp && comp !== 'jre-legacy') {
                // Ignore jre-legacy as it's default
                console.log(profile.id + ' -> ' + comp);
                jreMap[profile.id] = profile.javaVersion.component;
            }
        })
    );
    const keys = Object.keys(jreMap);
    keys.sort();
    const jreMapStripped = {};
    for (const k of keys) {
        jreMapStripped[k] = jreMap[k];
    }
    const jreMapPt = path.resolve(__dirname, '..', 'src', 'constra', 'jre-map.json');
    console.log('Writing jreMap to ' + jreMapPt);
    await outputJSON(jreMapPt, jreMapStripped, { spaces: 2 });

    const versionNamesPt = path.resolve(__dirname, '..', 'src', 'constra', 'version-names.json');
    console.log('Writing versionNames to ' + versionNamesPt);
    await outputJSON(versionNamesPt, versionNames, { spaces: 2 });
}

let fetch;

async function fetchJSON(u) {
    if (!fetch) {
        fetch = (await import('node-fetch')).default;
    }
    const res = await fetch(u);
    return await res.json();
}

void main();