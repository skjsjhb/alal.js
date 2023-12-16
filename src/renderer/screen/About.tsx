import { getLocaleSection } from '@/modules/i18n/Locale';
import { HTMLText } from '@/renderer/widgets/Texts';
import React from 'react';
import pkg from '../../../package.json';

export function About(): React.ReactElement {
    const tr = getLocaleSection('about');
    return (
        <div className={'ml-4 mr-4 mt-2'}>
            <div className={'text-5xl font-bold'}>{tr('title')}</div>
            <HTMLText
                html={tr('body', {
                    versionName: pkg.versionName,
                    version: pkg.version,
                    author: pkg.author,
                    packages: Object.keys(pkg.dependencies).join(' ')
                })}
            />
        </div>
    );
}
