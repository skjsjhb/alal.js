import { MAPI } from '@/background/MAPI';
import { addContainer, createContainer, getDefaultContainerPath } from '@/modules/container/ContainerManager';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { hashString } from '@/modules/util/Hash';
import { mergeArrays } from '@/modules/util/Objects';
import { useIntroNav } from '@/renderer/screen/intro/IntroSteps';
import { useMounted, useSafeState } from '@/renderer/util/Mount';
import { HTMLText, WarningText } from '@/renderer/widgets/Texts';
import { ipcRenderer } from 'electron';
import { Button } from 'primereact/button';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import React from 'react';

export function AddContainer(): React.ReactElement {
    const tr = getLocaleSection('add-container');
    const [containerList, setContainerList] = useSafeState<string[]>([getDefaultContainerPath()]);
    const mounted = useMounted();
    const next = useIntroNav('AddContainer');

    async function promptSelectDir() {
        const dirs = await ipcRenderer.invoke(MAPI.SELECT_FOLDER, tr('select-title'));
        if (mounted.current) {
            setContainerList(mergeArrays(containerList, dirs));
        }
    }

    function breakString(s: string, maxLength: number) {
        if (s.length <= maxLength) {
            return s;
        }
        const i = (maxLength - 3) / 2;
        return s.slice(0, i) + '...' + s.slice(s.length - i, s.length);
    }

    return (
        <div className={'ml-4 mr-4 mt-2'}>
            <div className={'text-5xl font-bold'}>{tr('title')}</div>
            <HTMLText html={tr('body')} />

            {/* Select dirs */}

            <Splitter>
                <SplitterPanel
                    size={90}
                    style={{ height: '10rem' }}
                    className={'flex flex-column m-4 gap-2 overflow-y-auto'}
                >
                    {containerList.map((c) => {
                        return (
                            <div
                                key={c}
                                className={'flex'}
                                onClick={() => {
                                    setContainerList(containerList.filter((d) => d != c));
                                }}
                            >
                                <i className={'pi pi-folder mr-2'} />
                                <code className={'text-sm'}>{breakString(c, 80)}</code>
                            </div>
                        );
                    })}
                </SplitterPanel>
                <SplitterPanel size={10} className={'flex justify-content-center align-items-center'}>
                    <Button onClick={promptSelectDir} icon={'pi pi-plus'} />
                </SplitterPanel>
            </Splitter>

            {containerList.length > 1 && <WarningText text={tr('warn1')} />}
            {containerList.length > 1 && <WarningText text={tr('warn2')} />}

            {/* Next page */}
            <div className={'flex justify-content-end mt-5'}>
                <Button
                    disabled={containerList.length == 0}
                    icon={'pi pi-arrow-right'}
                    label={tr('next')}
                    onClick={() => {
                        containerList.forEach((c) => {
                            const id = hashString(c);
                            addContainer(id, createContainer(id, c));
                        });
                        next();
                    }}
                />
            </div>
        </div>
    );
}
