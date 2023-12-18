import { css } from '@emotion/react';
import React from 'react';
import pkg from '../../../package.json';

/**
 * Display a line of version info at the right bottom.
 */
export function VersionFooter(): React.ReactElement {
    const styles = css`
        right: 0.5em;
        bottom: 0.5em;
        font-size: smaller;
    `;
    return (
        <div css={styles} className={'fixed text-color'}>
            alal.js {pkg.version} "{pkg.versionName}"
        </div>
    );
}
