import { useEffect, useRef } from "react";

/**
 * A hook to tell whether the current element is mounted.
 */
export function useMounted() {
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    return mounted;
}