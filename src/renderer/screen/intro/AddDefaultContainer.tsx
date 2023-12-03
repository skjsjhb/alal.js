import { ContainerManager } from "@/modules/container/ContainerManager";
import { Container } from "@/modules/container/ContainerTools";
import { Locale } from "@/modules/i18n/Locale";
import { useMounted } from "@/renderer/util/Mount";
import { CenterSpinner } from "@/renderer/widgets/CenterSpinner";
import { Radio } from "@/renderer/widgets/Radio";
import { InfoText, WarningText } from "@/renderer/widgets/Texts";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

/**
 * Detects and suggest the default container.
 */
export function AddDefaultContainer(): React.ReactElement {
    const tr = Locale.getSection("add-default-container");
    const [container, setContainer] = useState<Container | null | undefined>(undefined);
    const [allowContainer, setAllowContainer] = useState(true);
    const nav = useNavigate();
    const mounted = useMounted();

    useEffect(() => {
        (async () => {
            console.log("Detecting container for load.");
            await new Promise((res) => {
                setTimeout(res, 300000);
            });
            const ct = await ContainerManager.importContainer(ContainerManager.getDefaultContainerPath());
            if (mounted.current) {
                setContainer(ct);
            }
        })();
    }, []);

    // Now loading container
    if (container === undefined) {
        return <div className={"ml-4 mr-4 h-full"}>
            <CenterSpinner/>
        </div>;
    }

    // No container
    if (container == null) {
        console.log("No container found. Let's leave.");
        return <Navigate to={""}/>;
    }

    return <div className={"ml-4 mr-4"}>
        <div className={"text-5xl font-bold"}>{tr("title")}</div>
        <p dangerouslySetInnerHTML={{__html: tr("body", {path: container.rootDir})}}/>

        {/* Selection Radio Group */}
        <Panel header={tr("choices.title")} className={"mt-4"}>
            <div className={"flex flex-column gap-3"}>
                {/* Accept container */}
                <Radio checked={allowContainer}
                       onChange={(e) => setAllowContainer(!!e.checked)}
                       label={tr("choices.use")}/>


                {/* Ignore container */}
                <Radio checked={!allowContainer}
                       onChange={(e) => setAllowContainer(!e.checked)}
                       label={tr("choices.ignore")}/>
            </div>
        </Panel>

        {/* Disclaimer or hint */}
        <div className={"mt-4"}>
            {allowContainer ?
                <WarningText text={tr("disclaimer")}/> :
                <InfoText text={tr("hint")}/>
            }
        </div>

        {/* Hint */}

        {/* Next page */}
        <div className={"flex justify-content-end mt-5"}>
            <Button icon={"pi pi-arrow-right"} label={tr("next")}
                    onClick={() => nav("") /* TODO */}
            />
        </div>
    </div>;
}