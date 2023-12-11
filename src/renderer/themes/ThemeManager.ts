import { Options } from '@/modules/data/Options';
import darkTheme from '@/renderer/themes/theme-dark.css';
import lightTheme from '@/renderer/themes/theme-light.css';

export module ThemeManager {
    let usingTheme: any;
    let colorMode: 'light' | 'dark';

    export function applyColorMode(cm: 'light' | 'dark') {
        usingTheme?.unuse();
        if (cm == 'light') {
            usingTheme = lightTheme;
            lightTheme.use();
        }
        if (cm == 'dark') {
            usingTheme = darkTheme;
            darkTheme.use();
        }
        colorMode = cm;
        Options.get().ui.colorMode = cm;
        window.dispatchEvent(new CustomEvent('colorModeChanged', { detail: cm }));
    }

    export function setDefaultColorMode() {
        applyColorMode(getColorMode());
    }

    export function getColorMode(): 'light' | 'dark' {
        colorMode = Options.get().ui.colorMode as 'light' | 'dark';
        return colorMode;
    }
}