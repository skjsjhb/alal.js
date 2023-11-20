import { ReOptions } from "@/modules/redata/ReOptions";
import { ThemeOptions } from "@mui/material/styles";
import SakuraKumoDark from "./SakuraKumoDark";
import SakuraKumoLight from "./SakuraKumoLight";

/**
 * A collection of build-in theme entries.
 *
 * The theme system in ALAL has been redesigned and follow the strict styling standard. These are the
 * built-in themes which can be loaded directly. Users can also load custom theme files, but this
 * is considered rare.
 */
export namespace Themes {
    const BUNDLED_THEMES: Record<string, ThemeOptions> = {
        SakuraKumoLight, SakuraKumoDark
    };

    /**
     * Get the configured theme.
     *
     * This method returns the selected theme configured in `ui.theme` and chooses
     * SakuraKumoDark as the fallback.
     */
    export function getTheme(): ThemeOptions {
        return BUNDLED_THEMES[ReOptions.get().ui.theme] || SakuraKumoDark;
    }
}