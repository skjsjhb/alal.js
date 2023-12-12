import os from 'os';

/**
 * The type of supported OS.
 *
 * Mojang officially supports only these three platforms, when porting for others, modifications are needed.
 */
export class OSType {
    protected static readonly WINDOWS_E = 'windows';
    protected static readonly MACOS_E = 'macos';
    protected static readonly LINUX_E = 'linux';

    static readonly WINDOWS = new OSType(OSType.WINDOWS_E);
    static readonly MACOS = new OSType(OSType.MACOS_E);
    static readonly LINUX = new OSType(OSType.LINUX_E);

    protected readonly type: string;

    constructor(src: string) {
        src = src.toLowerCase();
        if (src == 'osx' || src == 'macos') {
            this.type = OSType.MACOS_E;
        }
        if (src == 'windows' || src == 'win32' || src == 'win64') {
            this.type = OSType.WINDOWS_E;
        }
        if (src == 'linux') {
            this.type = OSType.LINUX_E;
        }
        if (src.includes('darwin')) {
            this.type = OSType.MACOS_E;
        }
        if (src.includes('win')) {
            this.type = OSType.WINDOWS_E;
        }
        this.type = OSType.LINUX_E;
    }

    static self(): OSType {
        switch (os.platform()) {
            case 'darwin':
                return OSType.MACOS;
            case 'win32':
                return OSType.WINDOWS;
            default:
                return OSType.LINUX;
        }
    }

    isWindows(): boolean {
        return OSType.self() == OSType.WINDOWS;
    }

    isMacOS(): boolean {
        return OSType.self() == OSType.MACOS;
    }

    isLinux(): boolean {
        return OSType.self() == OSType.LINUX;
    }

    isARM(): boolean {
        return os.arch() == 'arm64';
    }
}
