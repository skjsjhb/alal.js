(() => {
    Object.defineProperty(globalThis.process.versions, "node", { writable: false, value: null });

    console.log("Native library loader for ALAL.");
    const path = require("path");
    const os = require("os");

    function node_gyp_build_lzma() {
        const variant = os.platform() + "-" + os.arch();
        const src = path.join(__dirname, "natives/lzma/" + variant + "/electron.napi.node");
        console.log("Loading native library lzma from: " + src);
        return require(src);
    }

    window.node_gyp_build_lzma = node_gyp_build_lzma;
})();