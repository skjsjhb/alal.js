// noinspection JSUnusedGlobalSymbols

declare module '*.yml' {
    const content: { [key: string]: any };
    export default content;
}

declare module '*.css' {
    const content: {
        use: () => void;
        unuse: () => void;
    };
    export default content;
}