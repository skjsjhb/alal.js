import { classNames } from 'primereact/utils';
import React, { DetailedHTMLProps, HTMLAttributes } from 'react';

export function WarningText(props: {
    text: string
} & DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>): React.ReactElement {
    return (
        <p  {...props} className={classNames('text-warning flex align-items-center', props.className)}>
            <i className={'pi pi-exclamation-triangle mr-2'} />
            {props.text}
        </p>
    );
}

export function SuccessText(props: {
    text: string
} & DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>): React.ReactElement {
    return (
        <p  {...props} className={classNames('text-success flex align-items-center', props.className)}>
            <i className={'pi pi-check mr-2'} />
            {props.text}
        </p>
    );
}

export function InfoText(props: {
    text: string
} & DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>): React.ReactElement {
    return (
        <p  {...props} className={classNames('text-color-secondary flex align-items-center', props.className)}>
            <i className={'pi pi-info-circle mr-2'} />
            {props.text}
        </p>
    );
}

export function HTMLText(props: {
    html: string
} & DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>): React.ReactElement {
    return <p {...props} dangerouslySetInnerHTML={{ __html: props.html }} />;
}