import { Options } from "@/modules/data/Options";
import SakuraKumoDark from "./SakuraKumoDark";
import SakuraKumoLight from "./SakuraKumoLight";

/**
 * A collection of build-in theme entries.
 *
 * The theme system in alal.js has been redesigned and follow the strict styling standard. These are the
 * built-in themes which can be loaded directly. Users can also load custom theme files, but this
 * is considered rare.
 */
export namespace Themes {
    // TODO update type use theme-ui
    const BUNDLED_THEMES: Record<string, any> = {
        SakuraKumoLight, SakuraKumoDark
    };

    /**
     * Get the configured theme.
     *
     * This method returns the selected theme configured in `ui.theme` and chooses
     * SakuraKumoDark as the fallback.
     */
    export function getTheme(): any {
        return BUNDLED_THEMES[Options.get().ui.theme] || SakuraKumoDark;
    }
}