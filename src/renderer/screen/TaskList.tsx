import { Locale } from '@/modules/i18n/Locale';
import { Task } from '@/modules/task/Task';
import { Title } from '@/renderer/widgets/Title';
import { css } from '@emotion/react';
import { ProgressBar } from 'primereact/progressbar';
import { classNames } from 'primereact/utils';
import React, { DetailedHTMLProps, HTMLProps, useEffect, useState } from 'react';

/**
 * A list of running tasks.
 */
export function TaskList(): React.ReactElement {
    const [tasks, setTasks] = useState(Task.getTasks());
    const tr = Locale.getSection('task-list');

    useEffect(() => {
        const listener = () => {
            setTasks(Task.getTasks()); // Update tasks
        };
        Task.subscribe(listener);
        return () => {
            Task.unsubscribe(listener);
        };
    }, []);

    return <>
        <Title icon={'pi pi-check-circle'} text={tr('title')} />
        {tasks.map((t, i) => <TaskDisplay key={i} task={t} />)}
    </>;
}

function TaskDisplay(props: {
    task: Task<any>
} & DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement>): React.ReactElement {
    const { task, className, ...rest } = props;

    const style = css`
        &.p-card .p-card-body {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
        }
    `;

    const barCSS = css`
        & .p-progressbar-value {
            ${props.task.getProgressPercent() == -1 ? '' : 'transition: 0s !important;'}

            ${props.task.failed ?
                    'background-color: var(--color-danger) !important;' :
                    props.task.resolved ?
                            'background-color: var(--color-success) !important;' : ''
            }
        }

        flex: 0 0 50%;
    `;

    const barStyles = {
        height: '6px',
        transition: props.task.getProgressPercent() == -1 ? undefined : '0s' // Prevent desynced bar length for intensive updates
    };

    const effectiveProgressMode = (props.task.getProgressPercent() == -1 && !props.task.resolved && !props.task.failed)
        ? 'indeterminate' : 'determinate';

    let effectiveProgress = props.task.getProgressPercent();
    if (effectiveProgress == -1) {
        if (props.task.resolved || props.task.failed) {
            effectiveProgress = 100;
        }
    }

    return <div {...rest} className={classNames(className, 'm-3')} css={style}>
        {/* Title and progress */}
        <div className={'flex'}>
            <div className={'flex'} style={{ flex: '0 0 50%' }}>
                <div className={'flex-grow-1' + (props.task.standalone ? ' font-bold' : '')}>{props.task.name}</div>
                <div className={'text-color-secondary mr-2'}>{props.task.getProgressString()}</div>
            </div>

            {/* Bar */}
            <ProgressBar
                css={barCSS}
                className={'mt-2 w-7'}
                style={barStyles}
                showValue={false}
                mode={effectiveProgressMode}
                value={effectiveProgress} />
        </div>
    </div>;
}