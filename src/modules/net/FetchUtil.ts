import { opt } from '@/modules/data/Options';
import { applyMirrors } from '@/modules/net/Mirrors';
import { getProxyAgent } from '@/modules/net/ProxyMan';
import fetch, { RequestInit } from 'node-fetch';

/**
 * A simple wrapper to `fetch` with JSON returned and mirrors applied. Errors are properly handled.
 */
export async function fetchJSON(url: string, init?: RequestInit): Promise<any> {
    const mirror = applyMirrors(url);

    const tries = opt().download.tries;
    let lastError;
    for (const _i of Array(tries)) {
        try {
            const response = await fetch(mirror, {
                ...init,
                agent: await getProxyAgent(mirror)
            });
            if (!response.ok) {
                lastError = 'Invalid status received for ' + mirror + ': ' + response.status;
                if (response.status == 404) {
                    break; // No need to retry
                }
                continue;
            }
            return await response.json();
        } catch (e) {
            lastError = e;
        }
    }
    console.error('Could not fetch ' + mirror + ': ' + lastError);
    return null;
}
