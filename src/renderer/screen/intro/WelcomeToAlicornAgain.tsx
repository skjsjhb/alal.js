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
        <div className={'ml-4 mr-4 mt-2 text-center'}>
            <ALALLogo />
            <div className={'text-4xl font-bold'}>{tr('title')}</div>
            <HTMLText html={tr('body')} />

            {/* Next page */}
            <Button className={'mt-5'} icon={'pi pi-arrow-right'} onClick={next} />

            {/* Skip setup*/}
            <div className={'flex justify-content-end mt-4'}>
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

function ALALLogo(): React.ReactElement {
    return (
        <div
            className={'flex justify-content-center align-items-center text-7xl'}
            style={{
                height: '12rem'
            }}
        >
            <div>
                <span style={{ color: '#cedffc' }}>Alicorn</span>&nbsp;&nbsp;
                <span style={{ color: '#fff4ff' }}>Ag</span>
                <span style={{ color: '#fdeca6' }}>ain</span>
            </div>
        </div>
    );
}
