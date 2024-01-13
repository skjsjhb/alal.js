import { getColorMode } from '@/renderer/themes/ThemeManager';
import { useSafeState } from '@/renderer/util/Hooks';
import { css } from '@emotion/react';
import React, { useEffect } from 'react';

/**
 * A board bringing gradient backgrounds.
 */
export function Board() {
    const [colorMode, setColorMode] = useSafeState(getColorMode());
    useEffect(() => {
        const fun = (e: Event) => {
            if (e instanceof CustomEvent) {
                setColorMode(e.detail);
            }
        };
        window.addEventListener('colorModeChanged', fun);
        return () => {
            window.removeEventListener('colorModeChanged', fun);
        };
    }, []);
    const boardCSS = css`
        @keyframes board-flow {
            0% {
                background-position: 0;
            }
            50% {
                background-position: 100%;
            }
            100% {
                background-position: 200%;
            }
        }

        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: -10;
        background: ${colorMode == 'dark'
            ? 'linear-gradient(to right, #4e79c2 0%, #9a30b7 50%, #4e79c2 100%)'
            : 'linear-gradient(to right, #ffb3ee 0%, #fceec6 50%, #ffb3ee 100%)'};
        background-size: 200%, 100%;
        animation: board-flow 8s infinite linear;
    `;

    return <div css={boardCSS} />;
}
