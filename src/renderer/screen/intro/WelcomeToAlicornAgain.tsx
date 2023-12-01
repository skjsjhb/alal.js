import { Locale } from "@/modules/i18n/Locale";
import { Button } from "primereact/button";
import { ConfirmPopup } from "primereact/confirmpopup";
import React, { useState } from "react";

export function WelcomeToAlicornAgain(): React.ReactNode {
    const tr = Locale.getSection("alicorn-again");

    const [confirmPopupVisible, setConfirmPopupVisible] = useState(false);

    return <div className={"ml-4"}>
        <div className={"text-5xl font-bold"}>{tr("title")}</div>
        <br/>
        <p dangerouslySetInnerHTML={{__html: tr("body")}}/>
        <div className={"flex justify-content-end mt-5"}>
            <Button icon={"pi pi-arrow-right"} className={"mr-5"} label={tr("next")}/>
        </div>
        <div className={"flex justify-content-end mt-5"}>
            <Button
                className={"mr-5 p-0"}
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
                // TODO go to next page
            }}
        />
    </div>;
}