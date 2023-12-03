import { Container } from "@/modules/container/ContainerTools";
import { JavaVersionMap } from "@/modules/jem/JavaVersionMap";
import { Launcher } from "@/modules/launch/Launcher";
import { ProfileTools } from "@/modules/profile/ProfileTools";
import path from "path";
import { TestTools } from "T/TestTools";
import assertEquals = TestTools.assertEquals;
import assertTrue = TestTools.assertTrue;
import test = TestTools.test;

export async function testLaunch() {
    const ct: Container = {
        rootDir: path.resolve("test-container"),
        locked: false,
        shared: false,
        isolated: false
    };
    await test("Synthesize Arguments", async () => {
        for (const v of ["1.20.2", "1.6.4", "1.5.2"]) {
            const profile = await ProfileTools.loadProfile(ct, v);
            if (profile) {
                const ai = await ProfileTools.loadAssetIndex(ct, profile);
                const args = Launcher.synthesizeArguments(ct, profile, ai);
                assertTrue(args.length > 0, "Arguments should not be empty");
            }
        }
    });

    await test("JRE Selection", async () => {
        assertEquals(JavaVersionMap.getJavaComponent("1.20.2"), "java-runtime-gamma",
            "JEM should return gamma for 1.20.2");
        assertEquals(JavaVersionMap.getJavaComponent("1.6.4"), "jre-legacy",
            "JEM should return legacy for 1.6.4");
        assertEquals(JavaVersionMap.getJavaComponent("21w44a"), "java-runtime-alpha",
            "JEM should return alpha for 21w44a");
    });
}