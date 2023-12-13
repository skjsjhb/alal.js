import { MAPI } from '@/background/MAPI';
import { OSType } from '@/modules/util/OSType';
import { ipcRenderer } from 'electron';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Agent } from 'node:http';
import { ProxyAgent } from 'proxy-agent';

let proxyAgent: ProxyAgent;

export async function getProxyAgent(url: string): Promise<Agent | undefined> {
    const sys = OSType.self();

    if (sys.isWindows()) {
        // On windows, Electron picks the proxy for us
        const proxyConfig = (await ipcRenderer.invoke(MAPI.GET_PROXY, url)) as string;
        if (proxyConfig.startsWith('DIRECT')) {
            return undefined;
        } else {
            const host = proxyConfig.replaceAll('PROXY', '').trim();
            return new HttpsProxyAgent('http://' + host);
        }
    } else {
        // Environment variables are set
        return proxyAgent ?? (proxyAgent = new ProxyAgent());
    }
}
