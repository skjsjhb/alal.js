import { ContainerManager } from "@/modules/container/ContainerManager";
import { Container, ContainerTools } from "@/modules/container/ContainerTools";
import { GameInstaller } from "@/modules/installer/GameInstaller";
import { ProfileTools } from "@/modules/profile/ProfileTools";
import { ensureDir, readdir } from "fs-extra";
import path from "path";
import { TestTools } from "T/TestTools";
import assertFalse = TestTools.assertFalse;
import assertNotEquals = TestTools.assertNotEquals;
import assertTrue = TestTools.assertTrue;
import shouldSimpleTest = TestTools.shouldSimpleTest;
import test = TestTools.test;

export async function testInstaller() {
    await ensureDir("test-container");
    const ct: Container = {
        rootDir: path.resolve("test-container"),
        locked: false,
        shared: false,
        isolated: false
    };
    if (shouldSimpleTest()) {
        await test("Simplified Game Installation", async () => {
            const allVersions = await ProfileTools.getMojangManifest();
            if (!allVersions) {
                console.warn("Manifest not available. Skipped test.");
                return;
            }
            // Test major versions: 1.20.2, 1.6.4, 1.5.2
            const versions = ["1.20.2", "1.6.4", "1.5.2"];
            let i = 0;
            for (const v of versions) {
                i++;
                console.debug(`Test installing ${v} (${i}/${versions.length})`);
                await GameInstaller.installVersionFull(ct, v).wait();
                const dirs = await readdir(ContainerTools.getNativesDirectory(ct, v));
                assertTrue(dirs.length > 0, "Natives dir is not empty");
            }
            await checkContainerContents();
        });
    } else {
        await test("Full Game Installation", async () => {
            const allVersions = await ProfileTools.getMojangManifest();
            if (!allVersions) {
                console.warn("Manifest not available. Skipped test.");
                return;
            }
            let i = 0;
            for (const v of allVersions.versions) {
                i++;
                console.debug(`Test installing ${v.id} (${i}/${allVersions.versions.length})`);
                await GameInstaller.installVersionFull(ct, v.id).wait();
                const dirs = await readdir(ContainerTools.getNativesDirectory(ct, v.id));
                assertTrue(dirs.length > 0, "Natives dir is not empty");
            }
            await checkContainerContents();
        });
    }

    await test("Container Detection", async () => {
        const res = await ContainerManager.importContainer("test-container");
        assertNotEquals(res, null, "Import container should success");
        assertFalse(res?.isolated, "Import container should not be isolated");
    });

    async function checkContainerContents() {
        const dirs = await readdir(path.join(ct.rootDir));
        assertTrue(dirs.includes("libraries"), "Libraries should exist");
        assertTrue(dirs.includes("resources"), "Mapped assets should exist");
        assertTrue(dirs.includes("assets"), "Assets folder should exist");
        assertTrue(dirs.includes("client-1.12.xml"), "Log config should exist");
        const assets = await readdir(path.join(ct.rootDir, "assets"));
        assertTrue(assets.includes("virtual"), "Legacy assets should exist");
        assertTrue(assets.includes("indexes"), "Asset indexes should exist");
        assertTrue(assets.includes("objects"), "Asset objects should exist");
    }
}
