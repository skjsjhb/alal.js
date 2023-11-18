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
            }
        ]
    })
];

main.entry.main = "./src/main/MainWithTests.ts";
main.devtool = false;
main.output.path = path.resolve(__dirname, "build/autotest");

renderer.entry.renderer = "./src/renderer/MainWithTests.ts";
renderer.devtool = false;
renderer.output.path = path.resolve(__dirname, "build/autotest");

module.exports = [main, renderer];
