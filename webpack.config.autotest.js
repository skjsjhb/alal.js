/*
 * This config generates the so-called 'autotest' output.
 * An autotest bundle is an extended version of debug bundle, with the capability of
 * self-launching and self-testing. It's not designated for user interactions. Instead,
 * it runs a series of tests and generate a report of the tests.
 */
const [mainDebug, rendererDebug] = require("./webpack.config.debug");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

mainDebug.plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, "resources/static"),
                to: path.resolve(__dirname, "build/autotest")
            }
        ]
    })
];

mainDebug.entry.main = "./src/main/MainWithTests.ts";
mainDebug.output.path = path.resolve(__dirname, "build/autotest");

rendererDebug.entry.renderer = "./src/renderer/MainWithTests.ts";
rendererDebug.output.path = path.resolve(__dirname, "build/autotest");

module.exports = [mainDebug, rendererDebug];
