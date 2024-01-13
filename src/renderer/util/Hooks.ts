import React, { useRef } from 'react';

/**
 * A hook to tell whether the current element is mounted.
 */
export function useMounted(): React.MutableRefObject<boolean> {
    const mounted = useRef(false);

    React.useEffect(() => {
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
    const [state, setState] = React.useState<T>(init);
    return [state, (s) => mounted.current && setState(s)];
}

/**
 * Async version of `useEffect` at the cost of losing the ability to return a cleanup callback.
 * If it's not necessary, an async iife can be omitted by using this method.
 */
export function useAsyncEffect(what: () => any, deps?: any[]): void {
    React.useEffect(() => {
        what();
    }, deps);
}

/**
 * Aliases for better code completion.
 */
export const useState = useSafeState;
