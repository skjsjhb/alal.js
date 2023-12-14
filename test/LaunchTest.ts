import { createLocalAccount } from '@/modules/auth/AccountTools';
import { Container } from '@/modules/container/ContainerTools';
import { getJavaComponentForProfile } from '@/modules/jem/JavaVersionMap';
import { synthesizeArguments } from '@/modules/launch/ArgsGenerator';
import { loadAssetIndex, loadProfile } from '@/modules/profile/ProfileTools';
import path from 'path';
import { TestTools } from 'T/TestTools';
import assertEquals = TestTools.assertEquals;
import assertTrue = TestTools.assertTrue;
import shouldSimpleTest = TestTools.shouldSimpleTest;
import test = TestTools.test;

export async function testLaunch() {
    const ct = new Container({
        rootDir: path.resolve('test-container'),
        locked: false,
        shared: false,
        isolated: false
    });
    await test('Synthesize Arguments', async () => {
        for (const v of ['1.20.2', '1.6.4', '1.5.2']) {
            const profile = await loadProfile(ct, v);
            if (profile) {
                let ai = shouldSimpleTest()
                    ? {
                          map_to_resources: false,
                          objects: {}
                      }
                    : await loadAssetIndex(ct, profile);
                const args = synthesizeArguments(ct, profile, ai, createLocalAccount('Player'));
                assertTrue(args.length > 0, 'Arguments should not be empty');
            }
        }
    });

    await test('JRE Selection', async () => {
        assertEquals(getJavaComponentForProfile('1.20.2'), 'java-runtime-gamma', 'JEM should return gamma for 1.20.2');
        assertEquals(getJavaComponentForProfile('1.6.4'), 'jre-legacy', 'JEM should return legacy for 1.6.4');
        assertEquals(getJavaComponentForProfile('21w44a'), 'java-runtime-alpha', 'JEM should return alpha for 21w44a');
    });
}
