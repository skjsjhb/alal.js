/*
 * This config generates production build.
 * Production builds are slower but optimized. Use for official releases and updates.
 */

process.env.NODE_ENV = 'production';

const [baseMain, baseRenderer, genConfig] = require('./webpack.config.base');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BannerPlugin, DefinePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const copyrightText =
    '@license\nCopyright (C) 2021-2022 Andy K Rarity Sparklight\nCopyright (C) 2023 Ted "skjsjhb" Gao' +
    '\nThis program is free software: you can redistribute it and/or modify it under the terms of' +
    ' the GNU General Public License as published by the Free Software Foundation, either version' +
    ' 3 of the License, or (at your option) any later version.\nThis program is distributed in the' +
    ' hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of' +
    ' MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for' +
    ' more details.\nYou should have received a copy of the GNU General Public License along with' +
    ' this program. If not, see <https://www.gnu.org/licenses/>.';

const prodCommon = {
    mode: 'production'
};

/** @type {import('terser').MinifyOptions} */
const terserOptions = {
    ecma: 2020
};

const rendererOpt = {
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({ terserOptions })]
    }
};

const main = {
    ...baseMain,
    ...prodCommon,
    entry: {
        main: './src/background/Main.ts'
    },
    output: {
        filename: '[name].js',
        pathinfo: false,
        path: path.resolve(__dirname, 'build/release')
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [...genConfig(path.resolve(__dirname, 'build/release'))]
        }),
        new BannerPlugin({
            banner: copyrightText,
            entryOnly: true
        }),
        new DefinePlugin({
            'process.env.MODE': "'release'"
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({ terserOptions })]
    }
};

const renderer = {
    ...baseRenderer,
    ...prodCommon,
    ...rendererOpt,
    entry: {
        renderer: './src/renderer/Main.ts'
    },
    output: {
        filename: '[name].js',
        pathinfo: false,
        path: path.resolve(__dirname, 'build/release')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'resources/build/template.html'),
            filename: 'renderer.html'
        }),
        new BannerPlugin({
            banner: copyrightText,
            entryOnly: true
        }),
        new DefinePlugin({
            'process.env.MODE': "'release'"
        }),
        process.env['ALAL_BUNDLE_ANALYZE'] && new BundleAnalyzerPlugin()
    ].filter(Boolean)
};

module.exports = [main, renderer];
