import { Locale } from "@/modules/i18n/Locale";
import { Files } from "@/modules/redata/Files";
import { Registry } from "@/modules/redata/Registry";
import { Downloader } from "@/modules/renet/Downloader";
import { ipcRenderer } from "electron";
import { readJSON } from "fs-extra";
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
    await test("Single File Download", async () => {
        const testFile = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9.1/OpenJDK17U-debugimage_x64_windows_hotspot_17.0.9_9.zip.json";
        await Downloader.webGetFile(testFile, "file.json", 5000, 100);
        const f = await readJSON("file.json");
        assertEquals(f.variant, "temurin");
    });
    await test("File Integrity Check", async () => {
        assertTrue(await Files.checkIntegrity("file.json", "29c9d911cdf957f926e37c0216f052c9c02e0b2a", "sha1"));
    });
    await saveSummary();
}

async function saveSummary() {
    console.log("Generating summary for tests.");
    await TestSummary.writeTestSummary();
}