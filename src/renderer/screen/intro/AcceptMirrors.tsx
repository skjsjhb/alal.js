import { opt } from '@/modules/data/Options';
import { getLocaleSection } from '@/modules/i18n/Locale';
import { testMirrorSpeed } from '@/modules/net/Mirrors';
import { useIntroNav } from '@/renderer/screen/intro/IntroSteps';
import { useMounted, useSafeState } from '@/renderer/util/Mount';
import { Radio } from '@/renderer/widgets/Radio';
import { WarningText } from '@/renderer/widgets/Texts';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import React, { useEffect, useRef } from 'react';

/**
 * Letting user know about the mirrors.
 */
export function AcceptMirrors(): React.ReactElement {
    const tr = getLocaleSection('accept-mirrors');
    const [allowMirrors, setAllowMirrors] = useSafeState(true);
    const userSelected = useRef(false);
    const [mirrorLatency, setMirrorSpeed] = useSafeState<number>(-2);
    const [originLatency, setOriginalSpeed] = useSafeState<number>(-2);
    const [suggestMirror, setSuggestMirror] = useSafeState(false);
    const next = useIntroNav('AcceptMirrors');
    const mounted = useMounted();

    useEffect(() => {
        (async () => {
            const [ogl, mil] = await Promise.all([testMirrorSpeed('minecraft-libraries'), testMirrorSpeed('mcbbs')]);
            if (mounted.current) {
                setOriginalSpeed(ogl);
                setMirrorSpeed(mil);
                const sm = mil != -2 && mil != -1 && mil < (ogl ?? 0);
                setSuggestMirror(sm);
                userSelected.current || setAllowMirrors(sm);
            }
        })();
    }, []);

    useEffect(() => {
        opt().download.allowMirror = allowMirrors ?? true;
    }, [allowMirrors]);

    function toReadableLatencyText(l: number): string {
        if (l == -2) return tr('latency-testing');
        if (l == -1) return tr('latency-invalid');
        return l + ' KB/s';
    }

    // Color the latency test as success if suggested, otherwise warning

    return (
        <div className={'ml-4 mr-4 mt-2'}>
            <div className={'text-5xl font-bold'}>{tr('title')}</div>
            <p>{tr('body')}</p>
            <p className={suggestMirror ? 'text-success' : 'text-warning'}>
                {tr('latency', {
                    m1: toReadableLatencyText(mirrorLatency),
                    m2: toReadableLatencyText(originLatency)
                })}
            </p>

            {/* Selection Radio Group */}
            <Panel header={tr('choices.title')} className={'mt-4'}>
                <div className={'flex flex-column gap-3'}>
                    {/* Accept */}
                    <Radio
                        checked={allowMirrors}
                        onChange={(e) => {
                            setAllowMirrors(!!e.checked);
                            userSelected.current = true;
                        }}
                        label={tr('choices.accept')}
                    />

                    {/* Deny */}
                    <Radio
                        checked={!allowMirrors}
                        onChange={(e) => {
                            setAllowMirrors(!e.checked);
                            userSelected.current = true;
                        }}
                        label={tr('choices.deny')}
                    />
                </div>
            </Panel>

            {/* Disclaimer and Trivia */}
            <div className={'mt-4'}>{allowMirrors && <WarningText text={tr('disclaimer')} />}</div>

            {/* Next page */}
            <div className={'flex justify-content-end mt-5'}>
                <Button icon={'pi pi-arrow-right'} label={tr('next')} onClick={next} />
            </div>
        </div>
    );
}
