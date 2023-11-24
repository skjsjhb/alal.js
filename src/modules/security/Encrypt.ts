import { CODE_32_SPECIAL } from "../commons/Constants";

let MACHINE_ID_32: string;


export function getUniqueID32(): string {
    return MACHINE_ID_32 || CODE_32_SPECIAL;
}

export function decryptByMachine(data: string): string {
    return data;
}

function encryptByMachine(data: string): string {
    return data;
}

export function encrypt2(src: string): string {
    return src;
}

export function decrypt2(src: string): string {
    return src;
}
