import { getJavaExecutable, hasJavaComponent, installJavaComponent } from '@/modules/jem/JavaGet';
import { execFile } from 'child_process';
import { TestTools } from './TestTools';
import assertEquals = TestTools.assertEquals;
import assertTrue = TestTools.assertTrue;
import shouldSimpleTest = TestTools.shouldSimpleTest;
import test = TestTools.test;

export async function testJavaDownload() {
    if (!shouldSimpleTest()) {
        await test('JavaGet Installation', async () => {
            const task = installJavaComponent('java-runtime-gamma');
            await task.wait();
            assertEquals(task.getProgressPercent(), 1, 'All files are downloaded');
            assertTrue(hasJavaComponent('java-runtime-gamma'), 'Component added');

            const e = await new Promise((res) => {
                execFile(getJavaExecutable('java-runtime-gamma'), ['-version'], (_e, _stdout, stderr) => {
                    res(stderr);
                });
            });
            assertTrue(String(e).includes('openjdk'), 'Exec output correctness');
        });
    }
}
