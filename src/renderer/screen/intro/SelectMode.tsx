import { Options } from "@/modules/data/Options";
import { Locale } from "@/modules/i18n/Locale";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { RadioButton } from "primereact/radiobutton";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function SelectMode(): React.ReactElement {
    const tr = Locale.getSection("select-mode");
    const [easyMode, setEasyMode] = useState(true);
    const easyName = "select-mode-easy";
    const advancedName = "select-mode-advanced";
    const nav = useNavigate();

    useEffect(() => {
        Options.get().ui.easyMode = easyMode;
    }, [easyMode]);

    return <div className={"ml-4 mr-4"}>
        <div className={"text-5xl font-bold"}>{tr("title")}</div>
        <br/>

        {/* Selection Radio Group */}
        <Panel header={tr("choices.title")} className={"mt-4"}>
            <div className={"flex flex-column"}>

                {/* Easy */}
                <div className={"flex align-items-center"}>
                    <RadioButton inputId={easyName}
                                 onChange={(e) => setEasyMode(!!e.checked)}
                                 checked={easyMode}/>
                    <label htmlFor={easyName}
                           className={"ml-2 cursor-pointer" + (easyMode ? "" : " text-color-secondary")}
                    >
                        {tr("choices.easy")}<br/>
                    </label>
                </div>
                {easyMode ?
                    <div className={"text-success mt-3 mb-3"}>{tr("trivia.easy")}</div> :
                    <div className={"mt-3"}/>}

                {/* Advanced */}
                <div className={"flex align-items-center"}>
                    <RadioButton inputId={advancedName}
                                 onChange={(e) => setEasyMode(!e.checked)}
                                 checked={!easyMode}/>
                    <label htmlFor={advancedName}
                           className={"ml-2 cursor-pointer" + (easyMode ? " text-color-secondary" : "")}
                    >{tr("choices.advanced")}</label>
                </div>

                {easyMode || <div className={"text-warning mt-3"}>{tr("trivia.advanced")}</div>}
            </div>
        </Panel>

        {/* Hint */}
        <p className={"text-color-secondary flex align-items-center"}>
            <i className={"pi pi-info-circle mr-2"}/>
            {tr("hint")}
        </p>

        {/* Next page */}
        <div className={"flex justify-content-end mt-5"}>
            <Button icon={"pi pi-arrow-right"} label={tr("next")}
                    onClick={() => nav("/Intro/AcceptMirrors")}
            />
        </div>
    </div>;
}