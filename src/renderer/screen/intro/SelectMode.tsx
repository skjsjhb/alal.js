import { Options } from "@/modules/data/Options";
import { Locale } from "@/modules/i18n/Locale";
import { Radio } from "@/renderer/widgets/Radio";
import { InfoText } from "@/renderer/widgets/Texts";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function SelectMode(): React.ReactElement {
    const tr = Locale.getSection("select-mode");
    const [easyMode, setEasyMode] = useState(true);
    const nav = useNavigate();

    useEffect(() => {
        Options.get().ui.easyMode = easyMode;
    }, [easyMode]);

    return <div className={"ml-4 mr-4"}>
        <div className={"text-5xl font-bold"}>{tr("title")}</div>

        {/* Selection Radio Group */}
        <Panel header={tr("choices.title")} className={"mt-4"}>
            <div className={"flex flex-column"}>

                {/* Easy */}
                <Radio checked={easyMode} onChange={(e) => setEasyMode(!!e.checked)} label={tr("choices.easy")}/>
                {easyMode ?
                    <div className={"text-success mt-3 mb-3"}>{tr("trivia.easy")}</div> :
                    <div className={"mt-3"}/>}

                {/* Advanced */}
                <Radio checked={!easyMode} onChange={(e) => setEasyMode(!e.checked)} label={tr("choices.advanced")}/>
                {easyMode || <div className={"text-warning mt-3"}>{tr("trivia.advanced")}</div>}
            </div>
        </Panel>

        {/* Hint */}
        <InfoText text={tr("hint")}/>

        {/* Next page */}
        <div className={"flex justify-content-end mt-5"}>
            <Button icon={"pi pi-arrow-right"} label={tr("next")}
                    onClick={() => nav("/Intro/AcceptMirrors")}
            />
        </div>
    </div>;
}