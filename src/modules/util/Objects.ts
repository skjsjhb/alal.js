/**
 * A recursive deep merge of two objects.
 * @param target Object to be assigned to.
 * @param sources Sources to assign, from left to right.
 */
export function mergeObjects(target: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
    for (const source of sources) {
        if (isObject(target) && isObject(source)) {
            for (const key in source) {
                if (isObject(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, { [key]: {} });
                    }
                    mergeObjects(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
    }
    return target;
}

function isObject(item: any) {
    return item && typeof item === 'object' && !Array.isArray(item);
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
export function getObjectPropertyByKey(target: any, k: string): any {
    const keys = k.split('.');
    let current: any = target;
    for (const key of keys) {
        if (current && typeof current == 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }
    return current;
}

/**
 * Writable version of {@link getObjectPropertyByKey}.
 */
export function setObjectPropertyByKey(target: any, k: string, v: any): void {
    const keys = k.split('.');
    let current: any = target;
    if (!current) {
        return;
    }
    const fink = keys[keys.length - 1]; // Refers to the final key
    keys.pop();
    for (const key of keys) {
        if (key == '__proto__' || key == 'constructor') continue;
        if (typeof current != 'object' || !(key in current)) {
            current[key] = {};
        }
        current = current[key];
    }
    current[fink] = v;
}

/**
 * Merge multiple arrays together without modifying any.
 */
export function mergeArrays(a: any[], ...b: any[][]): any[] {
    const o = a.concat();
    for (const arr of b) {
        for (const i of arr) {
            if (!a.includes(i)) {
                o.push(i);
            }
        }
    }
    return o;
}

export function upsertObjectKeyValue(obj: any, key: string, value: any) {
    key = key.toLowerCase();
    for (const k of Object.keys(obj)) {
        if (k.toLowerCase() == key) {
            obj[k] = value;
            return;
        }
    }
    obj[key] = value;
}

/**
 * Checks if two arrays overlaps with each other (at least one element is equal as JSON)
 */
export function doesArrayOverlap<T>(a: T[], b: T[]): boolean {
    for (const i of a) {
        for (const j of b) {
            if (a == b || JSON.stringify(i) == JSON.stringify(j)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Returns an array with given number of elements.
 */
export function repeat(i: number): never[] {
    const o = [];
    for (let j = 0; j < i; j++) {
        o.push(0);
    }
    return o as never[];
}
