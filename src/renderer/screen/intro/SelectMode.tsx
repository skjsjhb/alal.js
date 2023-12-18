import { opt } from '@/modules/data/Options';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { useIntroNav } from '@/renderer/screen/intro/IntroSteps';
import { useSafeState } from '@/renderer/util/Mount';
import { Radio } from '@/renderer/widgets/Radio';
import { Button } from 'primereact/button';
import React, { useEffect } from 'react';

export function SelectMode(): React.ReactElement {
    const tr = getLocaleSection('select-mode');
    const [easyMode, setEasyMode] = useSafeState(true);
    const next = useIntroNav('SelectMode');

    useEffect(() => {
        opt().ui.easyMode = easyMode;
    }, [easyMode]);

    return (
        <div className={'ml-4 mr-4 mt-2 text-center'}>
            <div className={'flex justify-content-center align-items-center'} style={{ height: '12rem' }}>
                <i className={'pi pi-user-plus text-8xl'} />
            </div>

            <div className={'text-4xl font-bold'}>{tr('title')}</div>

            {/* Selection Radio Group */}
            <div className={'flex justify-content-center mt-5'}>
                <div className={'flex flex-column gap-3 text-left'} style={{ maxWidth: '60%' }}>
                    {/* Easy */}
                    <Radio checked={easyMode} onChange={(e) => setEasyMode(!!e.checked)} label={tr('choices.easy')} />

                    {/* Advanced */}
                    <Radio
                        checked={!easyMode}
                        onChange={(e) => setEasyMode(!e.checked)}
                        label={tr('choices.advanced')}
                    />

                    {easyMode ? (
                        <div className={'text-success'}>{tr('trivia.easy')}</div>
                    ) : (
                        <div className={'text-warning'}>{tr('trivia.advanced')}</div>
                    )}
                </div>
            </div>

            {/* Next page */}
            <Button icon={'pi pi-arrow-right'} className={'mt-4'} onClick={next} />
        </div>
    );
}
