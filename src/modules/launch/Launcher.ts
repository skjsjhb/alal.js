import { Account } from '@/modules/auth/Account';
import { Container } from '@/modules/container/Container';
import { getJavaExecutable } from '@/modules/jem/JavaGet';
import { getJavaComponentForProfile } from '@/modules/jem/JavaVersionMap';
import { synthesizeArguments } from '@/modules/launch/ArgsGenerator';
import { GameInstance } from '@/modules/launch/Monitor';
import { loadAssetIndex, loadProfile } from '@/modules/profile/ProfileTools';

/**
 * Launches given profile on the given container.
 * @param c Container instance..
 * @param profId Profile ID.
 * @param a Authed account.
 */
export async function launch(c: Container, profId: string, a: Account): Promise<GameInstance> {
    try {
        console.log('Launching %s on %s', profId, c.rootDir);
        const profile = await loadProfile(c, profId);
        if (!profile) {
            // noinspection ExceptionCaughtLocallyJS Rethrow convience
            throw 'Could not load profile ' + profId;
        }
        const assetIndex = await loadAssetIndex(c, profile);
        const args = synthesizeArguments(c, profile, assetIndex, a);
        const comp = profile.javaVersion?.component || getJavaComponentForProfile(profile.id);
        const bin = getJavaExecutable(comp);
        return GameInstance.create(bin, args, c.getRuntimeRoot(profile.origin || profile.id));
    } catch (e) {
        console.error('Could not launch %s: %s', profId, e);
        throw e; // Rethrow to guarantee the caller receives this error
    }
}
