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
    await test("Test Installer", async () => {
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
            const t2 = GameInstaller.unpackNatives(ct, vp!);
            await t2.whenFinish();
            const nat = ContainerTools.getNativesDirectory(ct, vp!.id);
            const dirs = await readdir(nat);
            assertTrue(dirs.length > 0, "Natives dir is not empty");
        }
    });
}