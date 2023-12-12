import { getLocaleSection } from '@/modules/i18n/Locale';
import { useIntroNav } from '@/renderer/screen/intro/IntroSteps';
import { useSafeState } from '@/renderer/util/Mount';
import { HTMLText } from '@/renderer/widgets/Texts';
import { Button } from 'primereact/button';
import { ConfirmPopup } from 'primereact/confirmpopup';
import React from 'react';

export function WelcomeToAlicornAgain(): React.ReactNode {
    const tr = getLocaleSection('alicorn-again');
    const next = useIntroNav('WelcomeToAlicornAgain');
    const [confirmPopupVisible, setConfirmPopupVisible] = useSafeState(false);

    return (
        <div className={'ml-4 mr-4 mt-2'}>
            <div className={'text-5xl font-bold'}>{tr('title')}</div>
            <HTMLText html={tr('body')} />

            {/* Next page */}
            <div className={'flex justify-content-end mt-5'}>
                <Button icon={'pi pi-arrow-right'} label={tr('next')} onClick={next} />
            </div>

            {/* Skip setup*/}
            <div className={'flex justify-content-end mt-5'}>
                <Button
                    className={'p-1'}
                    severity={'secondary'}
                    label={tr('skip')}
                    text
                    onClick={() => setConfirmPopupVisible(true)}
                />
            </div>
            <ConfirmPopup
                visible={confirmPopupVisible}
                icon={'pi pi-question-circle'}
                onHide={() => setConfirmPopupVisible(false)}
                message={tr('skip-popup.body')}
                acceptLabel={tr('skip-popup.accept')}
                rejectLabel={tr('skip-popup.reject')}
                acceptClassName={'p-button-secondary'}
                rejectClassName={'p-button-text p-button-secondary'}
                accept={() => {
                    // TODO skip
                }}
            />
        </div>
    );
}
