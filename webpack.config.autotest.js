/*
 * This config generates debug build output.
 * Debug outputs are used during development. They builds fast, but are not optimized nor packed.
 */
const [baseMain, baseRenderer, genConfig] = require('./webpack.config.base');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');

const devCommon = {
    devtool: false,
    mode: 'development'
};

const main = {
    ...baseMain,
    ...devCommon,
    entry: {
        main: './test/Main.ts'
    },
    output: {
        filename: '[name].js',
        pathinfo: false,
        path: path.resolve(__dirname, 'build/autotest')
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                ...genConfig(path.resolve(__dirname, 'build/autotest'))
            ]
        }),
        new DefinePlugin({
            'process.env.MODE': '\'autotest\''
        })
    ]
};


const renderer = {
    ...baseRenderer,
    ...devCommon,
    entry: {
        renderer: './test/Renderer.ts'
    },
    output: {
        filename: '[name].js',
        pathinfo: false,
        path: path.resolve(__dirname, 'build/autotest')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'resources/build/template-dev.html'),
            filename: 'renderer.html'
        }),
        new DefinePlugin({
            'process.env.MODE': '\'autotest\''
        })
    ]
};

module.exports = [main, renderer];