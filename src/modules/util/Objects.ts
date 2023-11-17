export namespace Objects {

    function isObject(item: any) {
        return (item && typeof item === 'object' && !Array.isArray(item));
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
}