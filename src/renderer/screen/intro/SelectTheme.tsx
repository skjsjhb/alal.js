import { getLocaleSection } from '@/modules/i18n/Locale';
import { useIntroNav } from '@/renderer/screen/intro/IntroSteps';
import { applyColorMode, getColorMode } from '@/renderer/themes/ThemeManager';
import { useSafeState } from '@/renderer/util/Mount';
import { HTMLText, InfoText } from '@/renderer/widgets/Texts';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import React, { useEffect } from 'react';

export function SelectTheme(): React.ReactElement {
    const tr = getLocaleSection('select-theme');

    const colorNameDark = tr('choices.dark');
    const colorNameLight = tr('choices.light');

    const [colorMode, setColorMode] = useSafeState(getColorMode() == 'dark' ? colorNameDark : colorNameLight);
    const next = useIntroNav('SelectTheme');

    useEffect(() => {
        void applyColorMode(colorMode == colorNameDark ? 'dark' : 'light');
    }, [colorMode]);

    return (
        <div className={'ml-4 mr-4 mt-2'}>
            <div className={'text-5xl font-bold'}>{tr('title')}</div>
            <HTMLText html={tr('body')} />

            {/* Select Button */}
            <div className={'card flex justify-content-center'}>
                <SelectButton
                    value={colorMode}
                    onChange={(e) => setColorMode(e.value)}
                    options={[colorNameDark, colorNameLight]}
                />
            </div>

            {/* Hint */}
            <InfoText text={tr('hint')} />

            {/* Next page */}
            <div className={'flex justify-content-end mt-5'}>
                <Button icon={'pi pi-arrow-right'} label={tr('next')} onClick={next} />
            </div>
        </div>
    );
}
