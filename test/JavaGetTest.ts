import { JavaGet } from "@/modules/jem/JavaGet";
import { execFile } from "child_process";
import { TestTools } from "./TestTools";
import assertEquals = TestTools.assertEquals;
import assertTrue = TestTools.assertTrue;
import test = TestTools.test;

export async function testJavaDownload() {
    await test("JavaGet Installation", async () => {
        const task = JavaGet.installComponent("java-runtime-gamma");
        await task.whenFinish();
        assertEquals(task.getProgressPercent(), 1, "All files are downloaded");
        assertTrue(JavaGet.hasComponent("java-runtime-gamma"), "Component added");

        const e = await new Promise((res) => {
            execFile(JavaGet.getJavaExecutable("java-runtime-gamma"), ["-version"],
                (_e, _stdout, stderr) => {
                    res(stderr);
                });
        });
        assertTrue(String(e).includes("openjdk"), "Exec output correctness");
    });
}