/*
 * This config generates the so-called 'autotest' output.
 * An autotest bundle is an extended version of debug bundle, with the capability of
 * self-launching and self-testing. It's not designated for user interactions. Instead,
 * it runs a series of tests and generate a report of the tests.
 */
const [main, renderer] = require("./webpack.config.debug");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

main.plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, "resources/static"),
                to: path.resolve(__dirname, "build/autotest")
            },
            {
                from: path.resolve(__dirname, "node_modules/lzma-native/prebuilds"),
                to: path.resolve(__dirname, "build/autotest/node_modules/lzma-native/prebuilds")
            },
            {
                from: path.resolve(__dirname, "node_modules/lzma-native/build"),
                to: path.resolve(__dirname, "build/autotest/node_modules/lzma-native/build")
            },
            {
                from: path.resolve(__dirname, "node_modules/lzma-native/index.js"),
                to: path.resolve(__dirname, "build/autotest/node_modules/lzma-native/index.js")
            }
        ]
    })
];

main.entry.main = "./src/background/MainWithTests.ts";
main.devtool = false;
main.output.path = path.resolve(__dirname, "build/autotest");

renderer.entry.renderer = "./src/renderer/MainWithTests.ts";
renderer.devtool = false;
renderer.output.path = path.resolve(__dirname, "build/autotest");

module.exports = [main, renderer];
