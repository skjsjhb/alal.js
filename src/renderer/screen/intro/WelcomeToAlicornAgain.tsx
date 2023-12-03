import { Locale } from "@/modules/i18n/Locale";
import { Button } from "primereact/button";
import { ConfirmPopup } from "primereact/confirmpopup";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export function WelcomeToAlicornAgain(): React.ReactNode {
    const tr = Locale.getSection("alicorn-again");
    const nav = useNavigate();
    const [confirmPopupVisible, setConfirmPopupVisible] = useState(false);

    return <div className={"ml-4 mr-4"}>
        <div className={"text-5xl font-bold"}>{tr("title")}</div>
        <p dangerouslySetInnerHTML={{__html: tr("body")}}/>

        {/* Next page */}
        <div className={"flex justify-content-end mt-5"}>
            <Button icon={"pi pi-arrow-right"} label={tr("next")}
                    onClick={() => nav("/Intro/SelectMode")}
            />
        </div>

        {/* Skip setup*/}
        <div className={"flex justify-content-end mt-5"}>
            <Button
                className={"p-1"}
                severity={"secondary"}
                label={tr("skip")}
                text
                onClick={() => setConfirmPopupVisible(true)}
            />
        </div>
        <ConfirmPopup
            visible={confirmPopupVisible}
            icon={"pi pi-question-circle"}
            onHide={() => setConfirmPopupVisible(false)}
            message={tr("skip-popup.body")}
            acceptLabel={tr("skip-popup.accept")}
            rejectLabel={tr("skip-popup.reject")}
            acceptClassName={"p-button-secondary"}
            rejectClassName={"p-button-text p-button-secondary"}
            accept={() => {
                // TODO skip
            }}
        />
    </div>;
}