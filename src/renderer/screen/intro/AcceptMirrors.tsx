import { getLocaleSection } from '@/modules/i18n/Locale';
import { useIntroNav } from '@/renderer/screen/intro/IntroSteps';
import { HTMLText, WarningText } from '@/renderer/widgets/Texts';
import { Button } from 'primereact/button';
import React from 'react';

/**
 * Letting user know about the mirrors.
 */
export function AcceptMirrors(): React.ReactElement {
    const tr = getLocaleSection('accept-mirrors');
    const next = useIntroNav('AcceptMirrors');

    return (
        <div className={'ml-4 mr-4 mt-2 text-center'}>
            <div className={'flex justify-content-center align-items-center'} style={{ height: '12rem' }}>
                <i className={'pi pi-bolt text-8xl'} />
            </div>
            <div className={'text-4xl font-bold'}>{tr('title')}</div>
            <HTMLText html={tr('body')} />

            {/* Disclaimer and Trivia */}
            <WarningText className={'mt-4 justify-content-center'} text={tr('disclaimer')} />

            {/* Next page */}
            <Button icon={'pi pi-arrow-right'} onClick={next} />
        </div>
    );
}
