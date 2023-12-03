import { ThemeManager } from "@/renderer/themes/ThemeManager";
import { css } from "@emotion/react";
import React, { useEffect, useState } from "react";

/**
 * A board bringing gradient backgrounds.
 */
export function Board() {
    const [colorMode, setColorMode] = useState(ThemeManager.getColorMode);
    useEffect(() => {
        const fun = (e: Event) => {
            if (e instanceof CustomEvent) {
                setColorMode(e.detail);
            }
        };
        window.addEventListener("colorModeChanged", fun);
        return () => {
            window.removeEventListener("colorModeChanged", fun);
        };
    }, []);
    const boardCSS = css({
        position: "fixed",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: -10,
        background: colorMode == "light" ?
            "linear-gradient(to right, #ffb3ee, #fceec6);" :
            "linear-gradient(to right, #4e79c2, #9a30b7);"
    });
    return <div css={boardCSS}/>;
}