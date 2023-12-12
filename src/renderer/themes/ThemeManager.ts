import { opt } from '@/modules/data/Options';

let colorMode: 'light' | 'dark';

const activeThemeId = 'active-theme';

export async function applyColorMode(cm: 'light' | 'dark') {
    colorMode = cm;
    opt().ui.colorMode = cm;

    const styleLink = document.querySelector('style#' + activeThemeId);
    if (styleLink instanceof HTMLLinkElement) {
        styleLink.href = 'themes/' + cm + '.css';
    } else {
        const link = document.createElement('link');
        link.id = activeThemeId;
        link.rel = 'stylesheet';
        link.href = 'themes/' + cm + '.css';
        document.head.appendChild(link);
    }

    window.dispatchEvent(new CustomEvent('colorModeChanged', { detail: cm }));
}

export async function setDefaultColorMode() {
    await applyColorMode(getColorMode());
}

export function getColorMode(): 'light' | 'dark' {
    colorMode = opt().ui.colorMode as 'light' | 'dark';
    return colorMode;
}
