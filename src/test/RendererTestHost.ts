import { Locale } from "@/modules/i18n/Locale";
import { Registry } from "@/modules/redata/Registry";
import { ipcRenderer } from "electron";
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
    await saveSummary();
}

async function saveSummary() {
    console.log("Generating summary for tests.");
    await TestSummary.writeTestSummary();
}