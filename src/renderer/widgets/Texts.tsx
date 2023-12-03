import React from "react";

export function WarningText(props: { text: string }): React.ReactElement {
    return (
        <p className={"text-warning flex align-items-center"}>
            <i className={"pi pi-exclamation-triangle mr-2"}/>
            {props.text}
        </p>
    );
}

export function InfoText(props: { text: string }): React.ReactElement {
    return (
        <p className={"text-color-secondary flex align-items-center"}>
            <i className={"pi pi-info-circle mr-2"}/>
            {props.text}
        </p>
    );
}