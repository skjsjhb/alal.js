import Icons from '@/constra/icons.json';
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
    let image = (Icons as Record<string, string>)[profileType];
    if (!image) {
        image = 'GrassBlock.webp';
    }
    const src = 'img/' + image;
    return <img {...rest} src={src} alt={profileType}></img>;
}
