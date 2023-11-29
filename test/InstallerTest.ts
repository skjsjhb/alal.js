import { Container, ContainerTools } from "@/modules/container/ContainerTools";
import { GameInstaller } from "@/modules/installer/GameInstaller";
import { ProfileTools } from "@/modules/profile/ProfileTools";
import { ensureDir, readdir } from "fs-extra";
import path from "path";
import { TestTools } from "T/TestTools";
import assertTrue = TestTools.assertTrue;
import test = TestTools.test;

export async function testInstaller() {
    await ensureDir("test-container");
    const ct: Container = {
        rootDir: path.resolve("test-container"),
        locked: false,
        shared: false,
        isolated: false
    };
    await test("Libraries Installation", async () => {
        const allVersions = await ProfileTools.getMojangManifest();
        if (!allVersions) {
            console.warn("Manifest not available. Skipped test.");
            return;
        }
        let i = 0;
        for (const v of allVersions.versions) {
            i++;
            console.debug(`Test installing ${v.id} (${i}/${allVersions.versions.length})`);
            const vp = await GameInstaller.installProfile(ct, v.id).whenFinish();
            assertTrue(vp != null, "Profile successfully got");
            const t1 = GameInstaller.installLibraries(ct, vp!);
            await t1.whenFinish();
            if (v.type == "release") {
                // Only test client installation for releases
                // Or the test will take too long
                const cl = GameInstaller.installClient(ct, vp!);
                await cl.whenFinish();
            }
            const t2 = GameInstaller.unpackNatives(ct, vp!);
            await t2.whenFinish();
            const nat = ContainerTools.getNativesDirectory(ct, vp!.id);
            const dirs = await readdir(nat);
            assertTrue(dirs.length > 0, "Natives dir is not empty");
        }
    });

    await test("Assets Installation", async () => {
        const testedAssetIndices = new Set();
        const allVersions = await ProfileTools.getMojangManifest();
        if (!allVersions) {
            console.warn("Manifest not available. Skipped test.");
            return;
        }
        for (const v of allVersions.versions) {
            if (v.type == "release") {
                const vp = await GameInstaller.installProfile(ct, v.id).whenFinish();
                if (!vp) {
                    console.warn("Profile not available: " + v.id);
                    continue;
                }
                if (!testedAssetIndices.has(vp.assetIndex.id)) {
                    testedAssetIndices.add(vp.assetIndex.id);
                    const ai = await GameInstaller.installAssetIndex(ct, vp).whenFinish();
                    assertTrue(!!ai, "Asset index should not be null");
                    await GameInstaller.installAssets(ct, vp.assetIndex.id, ai!).whenFinish();
                }
            }
        }
        const dirs = await readdir(path.join(ct.rootDir));
        assertTrue(dirs.includes("resources"), "Mapped assets should exist");
        assertTrue(dirs.includes("assets"), "Assets folder should exist");
        const assets = await readdir(path.join(ct.rootDir, "assets"));
        assertTrue(assets.includes("virtual"), "Legacy assets should exist");
        assertTrue(assets.includes("indexes"), "Asset indexes should exist");
        assertTrue(assets.includes("objects"), "Asset objects should exist");
    });
}