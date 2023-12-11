import { css } from '@emotion/react';
import { ProgressSpinner } from 'primereact/progressspinner';
import React from 'react';

/**
 * A centered indeterminate spinner.
 */
export function CenterSpinner(): React.ReactElement {
    const style = css`
        width: 3rem;
        height: 3rem;
    `;
    return (
        <div className={'flex flex-column justify-content-center h-full'}>
            <div className={'flex justify-content-center text-primary'}>
                <ProgressSpinner
                    css={style}
                    strokeWidth={'5'}
                />
            </div>
        </div>
    );
}