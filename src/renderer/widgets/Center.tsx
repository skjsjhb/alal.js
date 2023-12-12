/**
 * Place content in the center of the div.
 */
import { css } from '@emotion/react';
import React, { DetailedHTMLProps, HTMLProps } from 'react';

export function Center(props: DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement>): React.ReactElement {
    const styles = css({
        display: 'flex',
        justifyContent: 'center'
    });

    return <div css={styles}>{props.children}</div>;
}
