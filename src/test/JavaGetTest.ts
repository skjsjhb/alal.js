import { JavaGet } from "@/modules/jem/JavaGet";
import { TestTools } from "@/test/TestTools";
import { execFile } from "child_process";
import assertTrue = TestTools.assertTrue;
import test = TestTools.test;

export async function testJavaDownload() {
    await test("JavaGet Installation", async () => {
        assertTrue(await JavaGet.installComponent("java-runtime-gamma"));
        const e = await new Promise((res) => {
            execFile(JavaGet.getJavaExecutable("java-runtime-gamma"), ["-version"],
                (_e, _stdout, stderr) => {
                    res(stderr);
                });
        });
        assertTrue(String(e).includes("openjdk"));
    });
}