import React, { useEffect, useRef, useState } from 'react';

/**
 * A hook to tell whether the current element is mounted.
 */
export function useMounted(): React.MutableRefObject<boolean> {
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    return mounted;
}


/**
 * Wraps the `useState()` hook with a mounted flag. The state is only set when the component is still mounted.
 *
 * This method requires the initial value to be set to avoid undefined types.
 * @param init Initial state.
 */
export function useSafeState<T>(init: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const mounted = useMounted();
    const [state, setState] = useState<T>(init);
    return [state, (s) => mounted.current && setState(s)];
}
