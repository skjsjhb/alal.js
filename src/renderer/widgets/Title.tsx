import { css } from '@emotion/react';
import { classNames } from 'primereact/utils';
import React, { DetailedHTMLProps, HTMLProps } from 'react';

export function Title(
    props: {
        icon?: string;
    } & DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement>
): React.ReactElement {
    const styles = css({
        display: 'flex',
        alignItems: 'center'
    });
    return (
        <div {...props} className={classNames('flex justify-content-center', props.className)}>
            <div css={styles}>
                <i className={classNames(props.icon, 'mr-2 text-xl')} />
                <span className={'font-bold text-2xl'}>{props.children}</span>
            </div>
        </div>
    );
}
