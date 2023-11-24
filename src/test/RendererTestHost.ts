import { Locale } from "@/modules/i18n/Locale";
import { Files } from "@/modules/redata/Files";
import { Registry } from "@/modules/redata/Registry";
import { Cacher } from "@/modules/renet/Cacher";
import { Downloader } from "@/modules/renet/Downloader";
import { Throttle } from "@/modules/util/Throttle";
import { testJavaDownload } from "@/test/JavaGetTest";
import { ipcRenderer } from "electron";
import { readFile, readJSON, remove } from "fs-extra";
import { SignalTest } from "./SignalTest";
import { TestSummary } from "./TestSummary";
import { TestTools } from "./TestTools";
import assertEquals = TestTools.assertEquals;
import assertNotEquals = TestTools.assertNotEquals;
import assertTrue = TestTools.assertTrue;
import test = TestTools.test;

export async function runRendererTests() {
    console.log("Automated tests for renderer process.");
    await allTests();
    console.log("Sending exit signal!");
    ipcRenderer.send(SignalTest.EXIT);
}


async function allTests() {
    await test("Renderer Exists", () => {
        assertTrue(ipcRenderer);
    });
    await test("Locale Loading", () => {
        Locale.setActiveLocale("en-US");
        assertEquals(Locale.getTranslation("name"), "English (US)");
    });
    await test("Mirror Latency Test", () => {
        // This is executed after a full initialization. Mirrors should be usable.
        assertNotEquals(Registry.getTable("mirrors", []).length, 0);
    });
    const testFile = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9.1/OpenJDK17U-debugimage_x64_windows_hotspot_17.0.9_9.zip.json";
    await test("Single File Download", async () => {
        await remove("file.json");
        await Downloader.downloadFile(Downloader.createProfile({
            url: testFile,
            location: "file.json",
            validation: "sha1",
            checksum: "29c9d911cdf957f926e37c0216f052c9c02e0b2a",
            cache: true
        }));
        const f = await readJSON("file.json");
        assertEquals(f.variant, "temurin");
    });
    await test("File Integrity Check", async () => {
        assertTrue(await Files.checkIntegrity("file.json", "29c9d911cdf957f926e37c0216f052c9c02e0b2a", "sha1"));
    });
    await test("File Cache", async () => {
        await Cacher.applyCache(testFile, "cache.json");
        assertEquals((await readFile("cache.json")).toString(), (await readFile("file.json")).toString());
    });
    await test("Throttle Pool", async () => {
        let a = 0;
        const pool = new Throttle.Pool(2);
        await Promise.all([pool.acquire(), pool.acquire()]);
        const prom = pool.acquire();
        prom.then(() => { a = 1;});
        assertEquals(pool.getSize(), 2);
        assertNotEquals(a, 1);
        pool.release();
        await prom;
        assertEquals(a, 1);
    });
    await testJavaDownload();
    await saveSummary();
}

async function saveSummary() {
    console.log("Generating summary for tests.");
    await TestSummary.writeTestSummary();
}