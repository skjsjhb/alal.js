import { opt } from '@/modules/data/Options';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { getObjectPropertyByKey, setObjectPropertyByKey } from '@/modules/util/Objects';
import { applyColorMode, getColorMode } from '@/renderer/themes/ThemeManager';
import { useSafeState, useState } from '@/renderer/util/Hooks';
import { HTMLText, InfoText, WarningText } from '@/renderer/widgets/Texts';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { SelectButton } from 'primereact/selectbutton';
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function Options(): React.ReactElement {
    const warnAccepted = useRef(false);
    const [opts, setOpts] = useState<any>(structuredClone(opt()));
    const [warnPromptVisible, setWarnPromptVisible] = useState(true);

    const tr = getLocaleSection('options');
    const nav = useNavigate();
    useEffect(() => {
        if (!warnAccepted.current) {
            setWarnPromptVisible(true);
        }
    }, [warnPromptVisible]);

    function onChange(n: any) {
        setOpts(n);
    }

    return (
        <div className={'ml-4 mr-4 mt-2'}>
            <ConfirmDialog
                visible={warnPromptVisible}
                onHide={(e) => {
                    setWarnPromptVisible(false);
                }}
                message={<HTMLText compact html={tr('warn-dialog.message')} />}
                header={tr('warn-dialog.title')}
                icon={'pi pi-exclamation-triangle'}
                acceptLabel={tr('warn-dialog.no')}
                rejectLabel={tr('warn-dialog.yes')}
                pt={{
                    acceptButton: {
                        root: {}
                    }
                }}
                accept={() => nav('/Home')}
                reject={() => {
                    setWarnPromptVisible(false);
                    warnAccepted.current = true;
                }}
            />
            <OnOffOption id={'dev'} opts={opts} onChange={onChange} level={'warn'} />
            <OnOffOption id={'ui.easyMode'} opts={opts} onChange={onChange} />
            <OnOffOption id={'download.allowMirror'} opts={opts} onChange={onChange} />
            <OnOffOption id={'jem.optimize'} opts={opts} onChange={onChange} />
            <OnOffOption id={'launch.showLauncherName'} opts={opts} onChange={onChange} />
            <NumberOption id={'download.maxTasks'} opts={opts} onChange={onChange} min={1} level={'warn'} />
            <NumberOption id={'download.tries'} opts={opts} onChange={onChange} min={1} />
            <NumberOption id={'download.minSpeed'} opts={opts} onChange={onChange} min={10} />
            <NumberOption id={'download.timeout'} opts={opts} onChange={onChange} min={1000} />
            <ThemeSelectOptions id={'ui.colorMode'} opts={opts} onChange={onChange} />
        </div>
    );
}

interface OptionsProps<T> {
    id: string; // Bind option key
    opts: any;
    onChange: (opts: any) => any;
    level?: 'info' | 'warn';
}

interface OptionHookResult<T> {
    value: T;
    onChange: (n: T) => any;
    htmlId: string;
    title: string;
    detail: string;
}

function useOption<T>(props: OptionsProps<T>): OptionHookResult<T> {
    const tr = getLocaleSection('options.' + props.id);
    const htmlId = 'opt-' + props.id;
    const title = tr('title');
    const detail = tr('detail');

    const value = getObjectPropertyByKey(props.opts, props.id);
    const onChange = (a: T) => {
        setObjectPropertyByKey(props.opts, props.id, a);
        props.onChange(structuredClone(props.opts));
    };
    return { htmlId, title, detail, value, onChange };
}

function ThemeSelectOptions(props: OptionsProps<'light' | 'dark'>): React.ReactElement {
    const tr = getLocaleSection('options.' + props.id);

    const colorNameDark = tr('dark');
    const colorNameLight = tr('light');

    const [colorMode, setColorMode] = useSafeState(getColorMode() == 'dark' ? colorNameDark : colorNameLight);

    const { htmlId, title, value, detail, onChange } = useOption<number>(props);

    useEffect(() => {
        void applyColorMode(colorMode == colorNameDark ? 'dark' : 'light');
    }, [colorMode]);

    return (
        <>
            <div className={'flex gap-3 align-items-center mt-2'}>
                <label htmlFor={htmlId} className={'text-xl'}>
                    {title}
                </label>
                <SelectButton
                    value={colorMode}
                    onChange={(e) => {
                        setColorMode(e.value);
                        onChange(e.value);
                    }}
                    options={[colorNameDark, colorNameLight]}
                />
            </div>
            {props.level == 'warn' ? (
                <WarningText className={'mt-1'} text={detail} />
            ) : (
                <InfoText className={'mt-1'} text={detail} />
            )}
        </>
    );
}

function NumberOption(props: OptionsProps<number> & { min?: number; max?: number }): React.ReactElement {
    const { htmlId, title, value, detail, onChange } = useOption<number>(props);
    return (
        <>
            <div className={'flex gap-3 align-items-center mt-2'}>
                <label htmlFor={htmlId} className={'text-xl'}>
                    {title}
                </label>
                <InputNumber
                    useGrouping={false}
                    inputId={htmlId}
                    value={value}
                    min={props.min}
                    max={props.max}
                    onChange={(e) => {
                        if (!e.value || !props.min || e.value < props.min || !props.max || e.value > props.max) {
                            return;
                        }
                        onChange(e.value);
                    }}
                />
            </div>
            {props.level == 'warn' ? (
                <WarningText className={'mt-1'} text={detail} />
            ) : (
                <InfoText className={'mt-1'} text={detail} />
            )}
        </>
    );
}

function OnOffOption(props: OptionsProps<boolean>): React.ReactElement {
    const { htmlId, title, value, detail, onChange } = useOption(props);

    return (
        <>
            <div className={'flex gap-3 align-items-center mt-1'}>
                <label htmlFor={htmlId} className={'text-xl'}>
                    {title}
                </label>
                <InputSwitch inputId={htmlId} checked={value} onChange={(e) => onChange(e.value)} />
            </div>
            {props.level == 'warn' ? (
                <WarningText className={'mt-1'} text={detail} />
            ) : (
                <InfoText className={'mt-1'} text={detail} />
            )}
        </>
    );
}
