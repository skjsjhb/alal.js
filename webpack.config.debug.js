/*
 * This config generates the so-called 'autotest' output.
 * An autotest bundle is an extended version of debug bundle, with the capability of
 * self-launching and self-testing. It's not designated for user interactions. Instead,
 * it runs a series of tests and generate a report of the tests.
 */
/*
 * This config generates debug build output.
 * Debug outputs are used during development. They builds fast, but are not optimized nor packed.
 */
const [baseMain, baseRenderer, rendererOptimization, genConfig] = require("./webpack.config.base");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ReactRefreshTypeScript = require('react-refresh-typescript');
const { DefinePlugin } = require("webpack");

const devCommon = {
    devtool: "eval-cheap-module-source-map",
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
                ...genConfig(path.resolve(__dirname, "build/debug"))
            ]
        }),
        new DefinePlugin({
            "process.env.MODE": "'debug'"
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
            template: path.resolve(__dirname, "resources/build/template-dev.html"),
            filename: "renderer.html"
        }),
        new ReactRefreshWebpackPlugin(),
        new DefinePlugin({
            "process.env.MODE": "'debug'"
        })
    ],
    devServer: {
        hot: true,
        port: 9000,
        static: path.resolve(__dirname, "build/debug")
    }
};

renderer.module.rules[0] = {
    test: /\.tsx?$/,
    use: [
        {
            loader: 'ts-loader',
            options: {
                getCustomTransformers: () => ({
                    before: [ReactRefreshTypeScript()]
                }),
                transpileOnly: true
            }
        }
    ]
};


module.exports = [main, renderer];
