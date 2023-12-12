import { MAPI } from '@/background/MAPI';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { mergeArrays } from '@/modules/util/Objects';
import { useMounted, useSafeState } from '@/renderer/util/Mount';
import { HTMLText, InfoText, WarningText } from '@/renderer/widgets/Texts';
import { ipcRenderer } from 'electron';
import { Button } from 'primereact/button';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import React from 'react';

export function AddContainer(): React.ReactElement {
    const tr = getLocaleSection('add-container');
    const [containerList, setContainerList] = useSafeState<string[]>([]);
    const mounted = useMounted();

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

            {/* Select Button */}
            <Splitter className={'h-15rem'}>
                <SplitterPanel className={'flex justify-content-center'} size={60}>
                    {/* Display selected container list */}
                    {containerList.length > 0 ? (
                        <div className={'flex flex-column w-full m-4 gap-2 overflow-y-auto'}>
                            {containerList.map((c) => {
                                return (
                                    <div key={c} className={'flex w-full'}>
                                        <i className={'pi pi-folder mr-2'} />
                                        <code className={'text-sm'}>{breakString(c, 40)}</code>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p>{tr('nothing')}</p>
                    )}
                </SplitterPanel>
                <SplitterPanel className={'flex align-items-center justify-content-center gap-3'} size={40}>
                    {/* Add and next button */}
                    <Button
                        icon={'pi pi-plus'}
                        label={tr(containerList.length > 0 ? 'add-more' : 'add')}
                        onClick={promptSelectDir}
                    />
                    <Button
                        icon={'pi pi-arrow-right'}
                        disabled={containerList.length == 0}
                        label={tr('next')}
                        /* TODO onClick */
                    />
                </SplitterPanel>
            </Splitter>

            <InfoText text={tr('hint')} />
            <WarningText text={tr('warn')} />
        </div>
    );
}
