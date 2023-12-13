import { checkFileIntegrity } from '@/modules/data/Files';
import { getRegTable } from '@/modules/data/Registry';
import { setActiveLocale, TR } from '@/modules/i18n/Locale';
import { applyCache } from '@/modules/net/Cacher';
import { createDownload, downloadFile } from '@/modules/net/Downloader';
import { fetchJSON } from '@/modules/net/FetchUtil';
import { isMojangProfile, isMojangVersionId } from '@/modules/profile/ProfileDetector';
import { Pool } from '@/modules/util/Throttle';
import { ipcRenderer } from 'electron';
import { readFile, readJSON, remove } from 'fs-extra';
import { testInstaller } from 'T/InstallerTest';
import { testLaunch } from 'T/LaunchTest';
import { testJavaDownload } from './JavaGetTest';
import { SignalTest } from './SignalTest';
import { TestSummary } from './TestSummary';
import { TestTools } from './TestTools';
import assertEquals = TestTools.assertEquals;
import assertNotEquals = TestTools.assertNotEquals;
import assertTrue = TestTools.assertTrue;
import shouldSimpleTest = TestTools.shouldSimpleTest;
import test = TestTools.test;

export async function runRendererTests() {
    console.log('Automated tests for renderer process.');
    await allTests();
    console.log('Sending exit signal!');
    ipcRenderer.send(SignalTest.EXIT);
}

async function allTests() {
    await test('Renderer Exists', () => {
        assertTrue(ipcRenderer, 'Value ipcRenderer exists');
    });
    await test('Locale Loading', async () => {
        await setActiveLocale('en-US');
        assertEquals(TR('name'), 'English (US)', 'Translation key should match');
    });
    await test('Mirror Latency Test', () => {
        // This is executed after a full initialization. Mirrors should be usable.
        assertNotEquals(getRegTable('mirrors_v2', { rules: [] }).rules.length, 0, 'Mirrors list not empty');
    });
    const testFile =
        'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9.1/OpenJDK17U-debugimage_x64_windows_hotspot_17.0.9_9.zip.json';
    await test('Single File Download', async () => {
        await remove('file.json');
        await downloadFile(
            createDownload({
                url: testFile,
                location: 'file.json',
                validation: 'sha1',
                checksum: '29c9d911cdf957f926e37c0216f052c9c02e0b2a',
                cache: true
            })
        );
        const f = await readJSON('file.json');
        assertEquals(f.variant, 'temurin', 'File content is correct');
    });
    await test('File Integrity Check', async () => {
        assertTrue(
            await checkFileIntegrity('file.json', '29c9d911cdf957f926e37c0216f052c9c02e0b2a', 'sha1'),
            'File hash matches'
        );
    });
    await test('File Cache', async () => {
        await applyCache(testFile, 'cache.json');
        assertEquals(
            (await readFile('cache.json')).toString(),
            (await readFile('file.json')).toString(),
            'Cached content correctness'
        );
    });
    await test('Throttle Pool', async () => {
        let a = 0;
        const pool = new Pool(2);
        await Promise.all([pool.acquire(), pool.acquire()]);
        const prom = pool.acquire();
        prom.then(() => {
            a = 1;
        });
        assertEquals(pool.getSize(), 2, 'Pool is full');
        assertNotEquals(a, 1, 'Value changes blocked');
        pool.release();
        await prom;
        assertEquals(a, 1, 'Value is now changed');
    });

    await test('Profile Detection for Mojang', async () => {
        const profiles = await fetchJSON('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
        const pool = new Pool(8);
        await Promise.all(
            profiles.versions.map(async (p: any) => {
                if (shouldSimpleTest()) {
                    const simpleVersions = [profiles.latest.release, '1.12.2', '1.6.4'];
                    if (!simpleVersions.includes(p.id)) {
                        return;
                    }
                }
                await pool.acquire();
                console.debug('Testing ' + p.id);
                const file = await fetchJSON(p.url);
                if (!file) {
                    console.error('Error fetching ' + p.id);
                    console.warn('This instance is ignored.');
                } else {
                    const st = isMojangProfile(file);
                    assertTrue(st, 'Required Mojang structure test: ' + p.id);
                    const id = file.id;
                    const isVer = isMojangVersionId(id);
                    assertTrue(isVer, 'Required Mojang version test: ' + p.id);
                }
                pool.release();
            })
        );
    });

    await testJavaDownload();
    await testInstaller();
    await testLaunch();
    await saveSummary();
}

async function saveSummary() {
    console.log('Generating summary for tests.');
    await TestSummary.writeTestSummary();
}
