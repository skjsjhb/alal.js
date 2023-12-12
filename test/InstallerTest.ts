import { importContainer } from '@/modules/container/ContainerManager';
import { Container } from '@/modules/container/ContainerTools';
import { GameInstallVariant, installGame } from '@/modules/installer/GameInstaller';
import { syncMojangProfileManifest } from '@/modules/profile/ProfileTools';
import { ensureDir, readdir } from 'fs-extra';
import path from 'path';
import { TestTools } from 'T/TestTools';
import assertFalse = TestTools.assertFalse;
import assertNotEquals = TestTools.assertNotEquals;
import assertTrue = TestTools.assertTrue;
import shouldSimpleTest = TestTools.shouldSimpleTest;
import test = TestTools.test;

export async function testInstaller() {
    await ensureDir('test-container');
    const ct: Container = new Container({
        rootDir: path.resolve('test-container'),
        locked: false,
        shared: false,
        isolated: false
    });
    if (shouldSimpleTest()) {
        await test('Simplified Game Installation', async () => {
            const allVersions = await syncMojangProfileManifest();
            if (!allVersions) {
                console.warn('Manifest not available. Skipped test.');
                return;
            }
            // Test major versions: 1.20.2, 1.6.4, 1.5.2
            const versions = ['1.20.2', '1.6.4', '1.5.2'];
            let i = 0;
            for (const v of versions) {
                i++;
                console.debug(`Test installing ${v} (${i}/${versions.length})`);
                await installGame(ct, v, GameInstallVariant.LIBS).wait();
                const dirs = await readdir(ct.getNativesDirectory(v));
                assertTrue(dirs.length > 0, 'Natives dir is not empty');
            }
            await checkContainerContents(true);
        });
    } else {
        await test('Full Game Installation', async () => {
            const allVersions = await syncMojangProfileManifest();
            if (!allVersions) {
                console.warn('Manifest not available. Skipped test.');
                return;
            }
            let i = 0;
            for (const v of allVersions.versions) {
                i++;
                console.debug(`Test installing ${v.id} (${i}/${allVersions.versions.length})`);
                await installGame(ct, v.id).wait();
                const dirs = await readdir(ct.getNativesDirectory(v.id));
                assertTrue(dirs.length > 0, 'Natives dir is not empty');
            }
            await checkContainerContents();
        });
    }

    await test('Container Detection', async () => {
        if (shouldSimpleTest()) {
            await ensureDir('test-container/assets'); // Caveat
        }
        const res = await importContainer('test-container');
        assertNotEquals(res, null, 'Import container should success');
        assertFalse(res?.isolated, 'Import container should not be isolated');
    });

    async function checkContainerContents(simplified = false) {
        const dirs = await readdir(path.join(ct.rootDir));
        assertTrue(dirs.includes('libraries'), 'Libraries should exist');
        if (!simplified) {
            assertTrue(dirs.includes('resources'), 'Mapped assets should exist');
            assertTrue(dirs.includes('assets'), 'Assets folder should exist');
            assertTrue(dirs.includes('client-1.12.xml'), 'Log config should exist');
            const assets = await readdir(path.join(ct.rootDir, 'assets'));
            assertTrue(assets.includes('virtual'), 'Legacy assets should exist');
            assertTrue(assets.includes('indexes'), 'Asset indexes should exist');
            assertTrue(assets.includes('objects'), 'Asset objects should exist');
        }
    }
}
