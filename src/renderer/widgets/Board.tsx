import { css } from "@emotion/react";
import React from "react";

/**
 * A board bringing gradient backgrounds.
 */
export function Board(props: { colorMode: "light" | "dark" }) {
    const boardCSS = css({
        position: "fixed",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: -10,
        background: props.colorMode == "light" ?
            "linear-gradient(to right, #ffb3ee, #fceec6);" :
            "linear-gradient(to right, #4e79c2, #9a30b7);"
    });
    return <div css={boardCSS}/>;
}