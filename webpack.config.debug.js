/*
 * This config generates debug build output.
 * Debug outputs are used during development. They builds fast, but are not optimized nor packed.
 */
const [baseMain, baseRenderer, rendererOptimization] = require("./webpack.config.base");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const devCommon = {
    devtool: "inline-cheap-module-source-map",
    mode: "development"
};

const main = {
    ...baseMain,
    ...devCommon,
    entry: {
        main: "./src/background/Main.ts"
    },
    output: {
        filename: "[name].js",
        pathinfo: false,
        path: path.resolve(__dirname, "build/debug")
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "resources/static"),
                    to: path.resolve(__dirname, "build/debug")
                },
                {
                    from: path.resolve(__dirname, "node_modules/lzma-native/prebuilds"),
                    to: path.resolve(__dirname, "build/debug/node_modules/lzma-native/prebuilds")
                },
                {
                    from: path.resolve(__dirname, "node_modules/lzma-native/build"),
                    to: path.resolve(__dirname, "build/debug/node_modules/lzma-native/build")
                },
                {
                    from: path.resolve(__dirname, "node_modules/lzma-native/index.js"),
                    to: path.resolve(__dirname, "build/debug/node_modules/lzma-native/index.js")
                }
            ]
        })
    ]
};

const renderer = {
    ...baseRenderer,
    ...devCommon,
    ...rendererOptimization,
    entry: {
        renderer: "./src/renderer/Main.ts"
    },
    output: {
        filename: "[name].js",
        pathinfo: false,
        path: path.resolve(__dirname, "build/debug")
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "resources/build/template.html"),
            filename: "renderer.html"
        })
    ]
};

module.exports = [main, renderer];