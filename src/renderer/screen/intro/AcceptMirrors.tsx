import { Options } from "@/modules/data/Options";
import { Locale } from "@/modules/i18n/Locale";
import { Mirrors } from "@/modules/net/Mirrors";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { RadioButton } from "primereact/radiobutton";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Letting user know about the mirrors.
 */
export function AcceptMirrors(): React.ReactElement {
    const tr = Locale.getSection("accept-mirrors");
    const [allowMirrors, setAllowMirrors] = useState(true);
    const [mirrorLatency, setMirrorLatency] = useState<number | null>(null);
    const [originLatency, setOriginLatency] = useState<number | null>(null);
    const allowName = "accept-mirrors-allow";
    const denyName = "accept-mirrors-deny";
    const nav = useNavigate();
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        (async () => {
            const ogl = await Mirrors.testMirrorLatency("minecraft-libraries");
            const mil = await Mirrors.testMirrorLatency("mcbbs");
            if (mounted.current) {
                setOriginLatency(ogl);
                setMirrorLatency(mil);
            }
        })();
    }, []);

    useEffect(() => {
        Options.get().download.allowMirror = allowMirrors;
    }, [allowMirrors]);

    function toReadableLatencyText(l: number | null): string {
        if (l == null) return tr("latency-testing");
        if (l == -1) return tr("latency-invalid");
        return l + "ms";
    }

    // Color the latency test as success if suggested, otherwise warning
    const suggestMirror = mirrorLatency != null && mirrorLatency != -1 && mirrorLatency < (originLatency ?? 0);

    return <div className={"ml-4 mr-4"}>
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
                <div className={"flex align-items-center"}>
                    <RadioButton inputId={allowName}
                                 onChange={(e) => setAllowMirrors(!!e.checked)}
                                 checked={allowMirrors}/>
                    <label htmlFor={allowName}
                           className={"ml-2 cursor-pointer" + (allowMirrors ? "" : " text-color-secondary")}
                    >{tr("choices.accept")}</label>
                </div>

                {/* Deny */}
                <div className={"flex align-items-center"}>
                    <RadioButton inputId={denyName}
                                 onChange={(e) => setAllowMirrors(!e.checked)}
                                 checked={!allowMirrors}/>
                    <label htmlFor={denyName}
                           className={"ml-2 cursor-pointer" + (allowMirrors ? " text-color-secondary" : "")}
                    >{tr("choices.deny")}</label>
                </div>
            </div>
        </Panel>

        {/* Disclaimer and Trivia */}
        <div className={"mt-4"}>
            {allowMirrors &&
                <p className={"text-warning flex align-items-center"}>
                    <i className={"pi pi-exclamation-triangle mr-2"}/>
                    {tr("disclaimer")}
                </p>
            }
        </div>

        {/* Next page */}
        <div className={"flex justify-content-end mt-5"}>
            <Button icon={"pi pi-arrow-right"} label={tr("next")}
                    onClick={() => nav("/Intro/SelectTheme")}
            />
        </div>
    </div>;
}