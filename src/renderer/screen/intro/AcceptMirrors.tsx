import { Options } from "@/modules/data/Options";
import { Locale } from "@/modules/i18n/Locale";
import { Mirrors } from "@/modules/net/Mirrors";
import { useMounted } from "@/renderer/util/Mount";
import { Radio } from "@/renderer/widgets/Radio";
import { WarningText } from "@/renderer/widgets/Texts";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Letting user know about the mirrors.
 */
export function AcceptMirrors(): React.ReactElement {
    const tr = Locale.getSection("accept-mirrors");
    const [allowMirrors, setAllowMirrors] = useState(true);
    const userSelected = useRef(false);
    const [mirrorLatency, setMirrorLatency] = useState<number | null>(null);
    const [originLatency, setOriginLatency] = useState<number | null>(null);
    const [suggestMirror, setSuggestMirror] = useState(false);
    const nav = useNavigate();
    const mounted = useMounted();

    useEffect(() => {
        (async () => {
            const ogl = await Mirrors.testMirrorLatency("minecraft-libraries");
            const mil = await Mirrors.testMirrorLatency("mcbbs");
            if (mounted.current) {
                setOriginLatency(ogl);
                setMirrorLatency(mil);
                const sm = mil != null && mil != -1 && mil < (ogl ?? 0);
                setSuggestMirror(sm);
                if (!userSelected.current) {
                    // User hasn't changed, we can change it
                    setAllowMirrors(sm);
                }
            }
        })();
    }, []);

    useEffect(() => {
        Options.get().download.allowMirror = allowMirrors ?? true;
    }, [allowMirrors]);

    function toReadableLatencyText(l: number | null): string {
        if (l == null) return tr("latency-testing");
        if (l == -1) return tr("latency-invalid");
        return l + "ms";
    }

    // Color the latency test as success if suggested, otherwise warning

    return <div className={"ml-4 mr-4 mt-2"}>
        <div className={"text-5xl font-bold"}>{tr("title")}</div>
        <p>{tr("body")}</p>
        <p className={suggestMirror ? "text-success" : "text-warning"}>
            {
                tr("latency",
                    {
                        m1: toReadableLatencyText(mirrorLatency),
                        m2: toReadableLatencyText(originLatency)
                    })
            }
        </p>

        {/* Selection Radio Group */}
        <Panel header={tr("choices.title")} className={"mt-4"}>
            <div className={"flex flex-column gap-3"}>

                {/* Accept */}
                <Radio checked={allowMirrors}
                       onChange={(e) => {
                           setAllowMirrors(!!e.checked);
                           userSelected.current = true;
                       }}
                       label={tr("choices.accept")}/>

                {/* Deny */}
                <Radio checked={!allowMirrors}
                       onChange={(e) => {
                           setAllowMirrors(!e.checked);
                           userSelected.current = true;
                       }}
                       label={tr("choices.deny")}/>

            </div>
        </Panel>

        {/* Disclaimer and Trivia */}
        <div className={"mt-4"}>
            {allowMirrors && <WarningText text={tr("disclaimer")}/>}
        </div>

        {/* Next page */}
        <div className={"flex justify-content-end mt-5"}>
            <Button icon={"pi pi-arrow-right"} label={tr("next")}
                    onClick={() => nav("/Intro/SelectTheme")}
            />
        </div>
    </div>;
}