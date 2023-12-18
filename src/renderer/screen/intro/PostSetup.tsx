import { getLocaleSection } from '@/modules/i18n/Locale';
import { HTMLText } from '@/renderer/widgets/Texts';
import { Button } from 'primereact/button';
import React from 'react';

export function PostSetup(): React.ReactElement {
    const tr = getLocaleSection('post-setup');

    return (
        <div className={'ml-4 mr-4 mt-2 text-center'}>
            <div className={'flex justify-content-center align-items-center'} style={{ height: '12rem' }}>
                <i className={'pi pi-check text-8xl'} />
            </div>

            <div className={'text-4xl font-bold'}>{tr('title')}</div>
            <HTMLText html={tr('body')} />

            <Button icon={'pi pi-arrow-right'} className={'mt-3'} />
            {/* TODO next page */}
        </div>
    );
}
