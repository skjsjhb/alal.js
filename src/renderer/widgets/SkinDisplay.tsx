import React, { DetailedHTMLProps, HTMLProps } from 'react';

const defaultSkin =
    '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';

/**
 * Display 2D skin avatar.
 */
export function SkinDisplay(
    props: {
        skin: string;
        size: number;
    } & DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement>
): React.ReactElement {
    const { skin, size, ...other } = props;
    const url = 'data:image/png;base64,' + (skin || defaultSkin);
    const htmlSize = size + 'em';
    return (
        <div
            {...other}
            style={{
                background: `url('${url}') -${htmlSize} -${htmlSize}`,
                backgroundSize: '800%',
                imageRendering: 'pixelated',
                width: htmlSize,
                height: htmlSize
            }}
        />
    );
}
