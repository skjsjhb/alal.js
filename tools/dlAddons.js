const os = require("os");
const { copyFile, remove } = require("fs-extra");
const { createGlobalProxyAgent } = require("global-agent");
let fetch;
const { pipeline } = require("stream/promises");
const { createWriteStream } = require("fs");
const decompress = require("decompress");

async function download(url, loc) {
    if (!fetch) {
        fetch = (await import("node-fetch")).default;
    }
    const res = await fetch(url, {
        agent: createGlobalProxyAgent()
    });
    if (res.ok) {
        await pipeline(res.body, createWriteStream(loc));
    }
}

async function dlAria2() {
    if (os.platform() === "win32" && os.arch() === "x64") {
        console.log("Downloading aria2 for Windows.");
        const aria2Url = "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip";
        await download(aria2Url, "build/addons/aria2-win32.zip");
        await decompress("build/addons/aria2-win32.zip", "build/addons/aria2-win32");
        await copyFile("build/addons/aria2-win32/aria2-1.37.0-win-64bit-build1/aria2c.exe", "build/addons/aria2c.exe");
        await remove("build/addons/aria2-win32");
        await remove("build/addons/aria2-win32.zip");
        console.log("Downloaded aria2 addon.");
    }
    if (os.platform() === "darwin" && os.arch() === "x64") {
        console.log("Downloading aria2 for macOS.");
        const aria2Url = "https://github.com/aria2/aria2/releases/download/release-1.35.0/aria2-1.35.0-osx-darwin.tar.bz2";
        await download(aria2Url, "build/addons/aria2-mac.tar.bz2");
        await decompress("build/addons/aria2-mac.tar.bz2", "build/addons/aria2-mac");
        await copyFile("build/addons/aria2-mac/aria2-1.35.0/bin/aria2c", "build/addons/aria2c");
        await remove("build/addons/aria2-mac");
        await remove("build/addons/aria2-mac.tar.bz2");
        console.log("Downloaded aria2 addon.");
    }
}

async function main() {
    console.log("Downloading optional addons...");
    await dlAria2();
    console.log("OK.");
}

void main();