import React, { DetailedHTMLProps, HTMLProps } from 'react';

/**
 * Shows an icon with specified profile type.
 */
export function ProfileImage(
    props: {
        profileType: string;
    } & DetailedHTMLProps<HTMLProps<HTMLImageElement>, HTMLImageElement>
): React.ReactElement {
    const { profileType, ...rest } = props;
    let src = '';
    switch (profileType) {
        case 'Mojang':
            src = 'img/CraftingTable.webp';
            break;
    }
    return <img {...rest} src={src} alt={profileType}></img>;
}
