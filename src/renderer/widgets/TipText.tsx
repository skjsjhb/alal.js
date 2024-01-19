import { getTip } from '@/renderer/util/Tips';
import React, { useEffect, useState } from 'react';

/**
 * A tip text display widget with configurable update interval.
 */
export function TipText(props: { updateInterval?: number }): React.ReactElement {
    const interval = props.updateInterval || 3000;
    const [tip, setTip] = useState(getTip());
    useEffect(() => {
        if (interval > 0) {
            const timer = setInterval(() => {
                setTip(getTip());
            }, interval);
            return () => clearInterval(timer);
        }
    }, []);
    return <>{tip}</>;
}
