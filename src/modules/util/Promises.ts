interface EmitterLike<C, L> {
    once(event: C, listener: L): any;
}

export function waitForEvent<C>(e: EmitterLike<C, () => void>, c: C): Promise<void> {
    return new Promise((res) => {
        e.once(c, res);
    });
}
