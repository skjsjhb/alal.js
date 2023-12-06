import { classNames } from "primereact/utils";
import React, { DetailedHTMLProps, HTMLProps } from "react";

export function Title(props: {
    icon: string;
    text: string;
} & DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement>): React.ReactElement {
    return <div  {...props} className={classNames("flex justify-content-center", props.className)}>
        <div className={"flex align-items-center"}>
            <i className={classNames(props.icon, "mr-2 text-xl")}/>
            <span className={"font-bold text-2xl"}>{props.text}</span>
        </div>
    </div>;
}
