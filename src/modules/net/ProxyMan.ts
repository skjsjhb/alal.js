import { MAPI } from '@/background/MAPI';
import { ipcRenderer } from 'electron';
import { HttpsProxyAgent } from 'https-proxy-agent';

export async function getProxyAgent(url: string): Promise<HttpsProxyAgent<string> | undefined> {
    const proxyConfig = (await ipcRenderer.invoke(MAPI.GET_PROXY, url)) as string;
    if (proxyConfig.startsWith('DIRECT')) {
        return undefined;
    } else {
        const host = proxyConfig.replaceAll('PROXY', '').trim();
        return new HttpsProxyAgent('http://' + host);
    }
}
