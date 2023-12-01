export namespace Objects {

    function isObject(item: any) {
        return (item && typeof item === "object" && !Array.isArray(item));
    }

    /**
     * A recursive deep merge of two objects.
     * @param target Object to be assigned to.
     * @param sources Sources to assign, from left to right.
     */
    export function merge(target: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
        for (const source of sources) {
            if (isObject(target) && isObject(source)) {
                for (const key in source) {
                    if (isObject(source[key])) {
                        if (!target[key]) {
                            Object.assign(target, {[key]: {}});
                        }
                        merge(target[key], source[key]);
                    } else {
                        Object.assign(target, {[key]: source[key]});
                    }
                }
            }
        }
        return target;
    }

    /**
     * Gets the property on an object using dot seperated key as chained index on the target.
     *
     * e.g.
     * ```js
     * const a = {};
     * a.b = {};
     * a.b.c = 1;
     * Objects.getPropertyByKey(a, "b.c"); // 1
     * ```
     *
     * Returns `undefined` if the key cannot be found, or a middle var cannot be indexed.
     *
     * @param target Object to be indexed.
     * @param k Properties chain split by dot.
     */
    export function getPropertyByKey(target: any, k: string): any {
        const keys = k.split(".");
        let current: any = target;
        for (const key of keys) {
            if (current && typeof current == "object" && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        return current;
    }

    export function upsertKeyValue(obj: any, key: string, value: any) {
        key = key.toLowerCase();
        for (const k of Object.keys(obj)) {
            if (k.toLowerCase() == key) {
                obj[k] = value;
                return;
            }
        }
        obj[key] = value;
    }
}