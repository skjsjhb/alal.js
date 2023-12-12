export function injectGlobalConvert() {
    // @ts-expect-error Injecting global reference without types
    globalThis['native_encoding'] = { convert: convertToUTF8 };
}

// Native implementation of icon-lite used in electron-fetch
function convertToUTF8(src: Buffer, _target: 'UTF-8', encoding: string): string {
    console.log('Converting buffer with length ' + src.length);
    const decoder = new TextDecoder(encoding);
    return decoder.decode(src);
}
