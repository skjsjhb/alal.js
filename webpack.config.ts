// noinspection JSUnresolvedReference

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import os from 'os';
import path from 'path';
import ReactRefreshTypeScript from 'react-refresh-typescript';
import TerserPlugin, { TerserOptions } from 'terser-webpack-plugin';
import webpack, { BannerPlugin, DefinePlugin } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import 'webpack-dev-server';

let target: 'autotest' | 'debug' | 'release';

if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'release') {
    target = 'release';
} else if (process.env.NODE_ENV == 'debug' || process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'dev') {
    target = 'debug';
} else {
    target = 'autotest';
}

const mode = target == 'release' ? 'production' : 'development';

const copyrightText =
    '@license\nCopyright (C) 2023 Ted "skjsjhb" Gao' +
    '\nThis program is free software: you can redistribute it and/or modify it under the terms of' +
    ' the GNU General Public License as published by the Free Software Foundation, either version' +
    ' 3 of the License, or (at your option) any later version.\nThis program is distributed in the' +
    ' hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of' +
    ' MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for' +
    ' more details.\nYou should have received a copy of the GNU General Public License along with' +
    ' this program. If not, see <https://www.gnu.org/licenses/>.';

const moduleResolution: webpack.ModuleOptions = {
    rules: [
        {
            test: /\.tsx?$/,
            include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'test')],
            use: [
                {
                    loader: 'ts-loader',
                    options: {
                        getCustomTransformers:
                            target == 'debug'
                                ? () => ({
                                      before: [ReactRefreshTypeScript()]
                                  })
                                : undefined,
                        transpileOnly: true
                    }
                }
            ],
            exclude: /node_modules/
        },
        {
            test: /\.css$/i,
            use: [
                {
                    loader: 'style-loader',
                    options: { injectType: 'lazyStyleTag' }
                },
                'css-loader'
            ]
        }
    ]
};

const resolveOptions: webpack.ResolveOptions = {
    symlinks: false,
    extensions: ['.ts', '.js', '.json', '.tsx'],
    alias: {
        '@': path.resolve(__dirname, 'src'),
        R: path.resolve(__dirname, 'resources'),
        T: path.resolve(__dirname, 'test')
    }
};

const externalOptions: webpack.Externals = [
    (ctx, callback) => {
        if (ctx.context?.includes('lzma-native') && ctx.request === 'node-gyp-build') {
            callback(null, 'global node_gyp_build_lzma');
            return;
        }
        if (ctx.request === 'pac-proxy-agent') {
            callback(null, 'global no_pac_proxy_agent');
            return;
        }
        if (ctx.request === 'web-streams-polyfill/dist/ponyfill.es2018.js') {
            // Electron always bundles Node > 16.x and therefore web streams are available
            callback(null, 'global undefined');
            return;
        }
        if (process.env.NODE_ENV === 'production') {
            if (ctx.request === 'react') {
                callback(null, 'global React');
                return;
            }
            if (ctx.request === 'react-dom') {
                callback(null, 'global ReactDOM');
                return;
            }
        }

        callback();
    }
];

const resourceMapFile = 'resources/build/resource-map.json';

function generateCopyList(output: string) {
    const out = [];
    const resMap = JSON.parse(fs.readFileSync(resourceMapFile).toString()) as Record<string, string>;
    const plat = os.platform() + '-' + os.arch();
    for (let [from, to] of Object.entries(resMap)) {
        from = from.replace('${platform}', plat);
        to = to.replace('${platform}', plat);
        if (fs.existsSync(from)) {
            out.push({
                from: from,
                to: path.join(output, String(to))
            });
        }
    }
    return out;
}

const terserOptions: TerserOptions = {
    ecma: 2020
};

const mainConfig: webpack.Configuration = {
    module: moduleResolution,
    resolve: resolveOptions,
    externals: externalOptions,
    target: 'electron-main',
    devtool: target == 'debug' ? 'eval-cheap-module-source-map' : false,
    mode,
    entry: {
        main: target == 'autotest' ? './test/Main.ts' : './src/background/Main.ts'
    },
    output: {
        filename: '[name].js',
        pathinfo: false,
        path: path.resolve(__dirname, 'build/' + target)
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [...generateCopyList(path.resolve(__dirname, 'build/' + target))]
        }),
        new DefinePlugin({
            'process.env.MODE': "'" + target + "'"
        }),
        target == 'release' &&
            new BannerPlugin({
                banner: copyrightText,
                entryOnly: true
            })
    ].filter(Boolean),
    optimization: {
        minimize: target == 'release',
        minimizer: [target == 'release' && new TerserPlugin({ terserOptions })].filter(Boolean)
    }
};

const rendererConfig: webpack.Configuration = {
    module: moduleResolution,
    resolve: resolveOptions,
    externals: externalOptions,
    target: 'electron-renderer',
    devtool: target == 'debug' ? 'eval-cheap-module-source-map' : false,
    mode,
    entry: {
        renderer: target == 'autotest' ? './test/Renderer.ts' : './src/renderer/Main.ts'
    },
    output: {
        filename: '[name].js',
        pathinfo: false,
        path: path.resolve(__dirname, 'build/' + target)
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, `resources/build/template${target == 'release' ? '' : '-dev'}.html`),
            filename: 'renderer.html'
        }),
        target == 'debug' && new ReactRefreshWebpackPlugin(),
        new DefinePlugin({
            'process.env.MODE': "'" + target + "'"
        }),
        target == 'release' &&
            new BannerPlugin({
                banner: copyrightText,
                entryOnly: true
            }),
        process.env['ALAL_BUNDLE_ANALYZE'] && new BundleAnalyzerPlugin()
    ].filter(Boolean),
    devServer:
        target != 'debug'
            ? undefined
            : {
                  hot: true,
                  port: 9000,
                  static: path.resolve(__dirname, 'build/debug')
              },
    optimization: {
        minimize: target == 'release',
        minimizer: [target == 'release' && new TerserPlugin({ terserOptions })].filter(Boolean),
        splitChunks:
            target == 'debug'
                ? {
                      cacheGroups: {
                          node_modules: {
                              test: /[\\/]node_modules[\\/]/,
                              name: 'node_modules',
                              chunks: 'all'
                          }
                      }
                  }
                : undefined
    }
};

export default [mainConfig, rendererConfig];
