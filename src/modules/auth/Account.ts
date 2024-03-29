export enum AccountType {
    Microsoft = 'MZ',
    Local = 'AL',
    Yggdrasil = 'YG'
}

export interface Account {
    type: AccountType;
    host: string; // Authlib Injector
    playerName: string; // Authenticated player name
    email: string; // Authlib Injector
    refreshToken: string; // MS and Authlib Injector
    uuid: string;
    accessToken: string;
    xuid: string; // Microsoft
    skin: string; // Base64 encoded skin
}
