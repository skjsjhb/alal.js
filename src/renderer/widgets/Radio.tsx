import { nanoid } from "nanoid";
import { RadioButton, RadioButtonChangeEvent, RadioButtonProps } from "primereact/radiobutton";
import React, { useRef } from "react";

export function Radio(props: {
    checked: boolean,
    onChange: (e: RadioButtonChangeEvent) => void,
    label: string
} & RadioButtonProps): React.ReactElement {
    const id = useRef(nanoid());
    return <div className={"flex align-items-center"}>
        <RadioButton inputId={id.current} {...props}/>
        <label htmlFor={id.current}
               className={"ml-2 cursor-pointer" + (props.checked ? "" : " text-color-secondary")}>
            {props.label}
        </label>
    </div>;
}