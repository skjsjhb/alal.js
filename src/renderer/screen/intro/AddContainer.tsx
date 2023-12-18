import { MAPI } from '@/background/MAPI';
import { addContainer, createContainer, getDefaultContainerPath } from '@/modules/container/ContainerManager';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { hashString } from '@/modules/util/Hash';
import { mergeArrays } from '@/modules/util/Objects';
import { useIntroNav } from '@/renderer/screen/intro/IntroSteps';
import { useMounted, useSafeState } from '@/renderer/util/Mount';
import { WarningText } from '@/renderer/widgets/Texts';
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
        <div className={'ml-4 mr-4 mt-2 text-center'}>
            <div className={'flex justify-content-center align-items-center'} style={{ height: '6rem' }}>
                <i className={'pi pi-folder-open text-6xl'} />
            </div>

            <div className={'text-4xl font-bold'}>{tr('title')}</div>

            {/* Select dirs */}
            <div className={'flex justify-content-center mt-3'}>
                <Splitter style={{ width: '80%' }}>
                    <SplitterPanel
                        size={85}
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
                    <SplitterPanel size={15} className={'flex justify-content-center align-items-center'}>
                        <Button onClick={promptSelectDir} icon={'pi pi-plus'} />
                    </SplitterPanel>
                </Splitter>
            </div>

            {containerList.length > 1 && <WarningText className={'justify-content-center'} text={tr('warn')} />}

            {/* Next page */}
            <Button
                className={'mt-3'}
                disabled={containerList.length == 0}
                icon={'pi pi-arrow-right'}
                onClick={() => {
                    containerList.forEach((c) => {
                        const id = hashString(c);
                        addContainer(id, createContainer(id, c));
                    });
                    next();
                }}
            />
        </div>
    );
}
