(() => {
    console.log("Native library loader.");
    const path = require("path");
    const os = require("os");

    function node_gyp_build_lzma() {
        const variant = os.platform() + "-" + os.arch();
        const src = path.join(__dirname, "natives/lzma/" + variant + "/electron.napi.node");
        console.log("Loading native library lzma from: " + src);
        return require(src);
    }

    const no_pac_proxy_agent = {
        PacProxyAgent: {
            protocols: [],
        }
    }

    window.node_gyp_build_lzma = node_gyp_build_lzma;
    window.no_pac_proxy_agent = no_pac_proxy_agent;
})();