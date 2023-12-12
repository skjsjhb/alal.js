import { Signals } from '@/background/Signals';
import Sources from '@/constra/sources.json';
import { Account, AccountType } from '@/modules/auth/Account';
import { Registry } from '@/modules/data/Registry';
import { Locale } from '@/modules/i18n/Locale';
import { fetchHeaders, fetchJSON } from '@/modules/net/FetchUtil';
import { Task } from '@/modules/task/Task';
import { Hash } from '@/modules/util/Hash';
import { createHash } from 'crypto';
import { ipcRenderer } from 'electron';
import { nanoid } from 'nanoid';
import path from 'path';

export module AccountTools {
    const accountTableId = 'accounts';

    /**
     * Generates local account from given name.
     * A fake access token is generated. UUID is calculated as mentioned here: https://wiki.vg/Protocol#Login
     */
    export function createLocalAccount(name: string): Account {
        return {
            uuid: getOfflinePlayerUUID(name),
            accessToken: nanoid(20),
            refreshToken: '',
            email: '',
            playerName: name,
            xuid: '',
            host: 'localhost',
            type: AccountType.Local
        };
    }

    // A subsequent requests to convert browser code to tokens.
    export function authMicrosoft(code: string, role: 'code' | 'refresh'): Task<Account> {
        const taskExec = async (task: Task<Account>) => {
            try {
                const grantTag = role == 'code' ? 'code' : 'refresh_token';
                const grantType = role == 'code' ? 'authorization_code' : 'refresh_token';

                console.log('Retrieving token.');

                const body = `client_id=00000000402b5328&${grantTag}=${code}&grant_type=${grantType}` +
                    `&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf` +
                    `&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL`;

                const { access_token: msToken, refresh_token: msRefreshToken } = await fetchJSON(Sources.msTokenAPI, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body
                });
                task.success();

                console.log('Token -> XBL');
                const {
                    Token: xblToken,
                    DisplayClaims: { xui: [{ uhs: userHash }] }
                } = await postJSON(Sources.xblAPI, {
                    Properties: {
                        AuthMethod: 'RPS',
                        SiteName: 'user.auth.xboxlive.com',
                        RpsTicket: msToken // Note: not what wiki.vg said - no `d=` as prefix!
                    },
                    RelyingParty: 'http://auth.xboxlive.com', // Should be kept as-is
                    TokenType: 'JWT'
                });
                task.success();

                console.log('XBL -> XSTS');
                const { Token: xstsToken } = await postJSON(Sources.xstsAPI, {
                    Properties: {
                        SandboxId: 'RETAIL',
                        UserTokens: [xblToken]
                    },
                    RelyingParty: 'rp://api.minecraftservices.com/',
                    TokenType: 'JWT'
                });
                task.success();

                console.log('XBL -> XUID');
                const { DisplayClaims: { xui: [{ xid: xuid }] } } = await postJSON(Sources.xstsAPI, {
                    Properties: {
                        SandboxId: 'RETAIL',
                        UserTokens: [xblToken]
                    },
                    RelyingParty: 'http://xboxlive.com',
                    TokenType: 'JWT'
                });
                task.success();

                console.log('XSTS -> Access Token');
                const { access_token: accessToken } = await postJSON(Sources.mcLoginAPI, {
                    identityToken: `XBL3.0 x=${userHash};${xstsToken}`
                });
                task.success();

                console.log('Access Token -> Profile');
                const { id: uuid, name: playerName } = await fetchJSON(Sources.mcProfileAPI, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                task.success();

                console.log('Done with Microsoft login. Welcome, ' + playerName + '!');
                // Assemble
                task.resolve({
                    uuid, xuid, accessToken, type: AccountType.Microsoft, email: '', playerName,
                    refreshToken: msRefreshToken, host: 'https://api.minecraftservices.com' // Only a placeholder
                });
            } catch (e) {
                task.reject(e);
            }
        };

        const taskName = Locale.getTranslation('ms-auth');
        return new Task(taskName, 6, taskExec);
    }

    interface YggdrasilProfile {
        id: string; // UUID
        name: string; // Name of the profile (not the account)
    }

    /**
     * Authenticate with Yggdrasil server.
     *
     * For Yggdrasil servers there could possibly be multiple 'accounts' (i.e. profiles) for one user. This
     * method returns them all, with the selected profile always on the first.
     */
    // TODO convert to task
    export function authYggdrasil(rawHost: string, user: string, pwd: string): Task<Account> {
        const taskExec = async (task: Task<Account>) => {
            try {
                let host = await resolveYggdrasilLocation(rawHost);
                console.log('Resolved Yggdrasil host: ' + host);
                if (host.endsWith('/')) {
                    host = host.slice(0, host.length - 1);
                }
                const authAPI = host + '/authserver/authenticate';

                const { accessToken, selectedProfile, refreshToken }: {
                    accessToken: string, refreshToken: string,
                    selectedProfile: YggdrasilProfile
                } = await postJSON(authAPI, {
                    username: user,
                    password: pwd,
                    agent: {
                        name: 'Minecraft',
                        version: 1
                    }
                });
                if (!selectedProfile) {
                    return null; // TODO support profile selection
                    // multiple profiles
                }
                task.resolve({
                    host, accessToken, uuid: selectedProfile.id, xuid: '', playerName: selectedProfile.name,
                    email: user, type: AccountType.Yggdrasil, refreshToken
                });
            } catch (e) {
                task.reject(e);
            }
        };
        const taskName = Locale.getTranslation('yggdrasil-auth');
        return new Task(taskName, 1, taskExec);
    }

    // Use ALI to get the API location
    async function resolveYggdrasilLocation(host: string): Promise<string> {
        const hostURL = new URL(host);
        const headers = await fetchHeaders(host);
        const location = Object.entries(headers).find(([k]) => k.toLowerCase() == 'x-authlib-injector-api-location');
        if (location) {
            const url = String(location[1]);
            if (url.includes('://')) {
                return url;
            }
            hostURL.pathname = path.join(hostURL.pathname, url);
            return hostURL.toString();
        }
        return host;
    }

    /**
     * Saves an account for use in the future.
     *
     * The account will be encrypted if encryption module is available.
     */
    export async function saveAccount(a: Account) {
        const accountKey = Hash.hashString(a.host + a.uuid + a.email);
        Registry.getTable<Record<string, string>>(accountTableId, {})[accountKey] = await dumpAccount(a);
    }

    // Account -> Encrypted string
    async function dumpAccount(a: Account): Promise<string> {
        if (!await ipcRenderer.invoke(Signals.CHECK_ENCRYPT)) {
            console.warn('Encryption is not available. Credentials stored as plain text.');
            return JSON.stringify(a);
        } else {
            return await ipcRenderer.invoke(Signals.ENCRYPT, JSON.stringify(a));
        }
    }

    // Encrypted string -> Account
    async function loadAccount(s: string): Promise<Account> {
        if (!await ipcRenderer.invoke(Signals.CHECK_ENCRYPT)) {
            return JSON.parse(s) as Account;
        } else {
            return JSON.parse(await ipcRenderer.invoke(Signals.DECRYPT, s));
        }
    }

    async function postJSON(url: string, body: any) {
        return await fetchJSON(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(body)
        });
    }

    // https://stackoverflow.com/questions/47505620/javas-uuid-nameuuidfrombytes-to-written-in-javascript
    function getOfflinePlayerUUID(name: string): string {
        const md5Bytes = createHash('md5').update('OfflinePlayer:' + name).digest();
        md5Bytes[6] &= 0x0f;
        md5Bytes[6] |= 0x30;
        md5Bytes[8] &= 0x3f;
        md5Bytes[8] |= 0x80;
        return md5Bytes.toString('hex');
    }
}