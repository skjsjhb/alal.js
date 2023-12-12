/*
 * The base common config for webpack builds.
 * Note that this cannot be used for build directly.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const resources = fs.readFileSync('resources/build/resource-map.json');

const moduleResolution = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'test')],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.ya?ml$/,
                include: path.resolve(__dirname, 'src'),
                use: 'yaml-loader'
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
    },
    resolve: {
        symlinks: false,
        extensions: ['.ts', '.js', '.json', '.tsx'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            R: path.resolve(__dirname, 'resources'),
            T: path.resolve(__dirname, 'test')
        }
    },
    externals: [
        (ctx, callback) => {
            if (ctx.context.includes('lzma-native') && ctx.request === 'node-gyp-build') {
                callback(null, 'global node_gyp_build_lzma');
                return;
            }
            if (ctx.context.includes('electron-fetch') && ctx.request === 'encoding') {
                callback(null, 'global native_encoding');
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
    ]
};

const baseConfig = {
    main: {
        ...moduleResolution,
        target: 'electron-main'
    },
    renderer: {
        ...moduleResolution,
        target: 'electron-renderer'
    }
};

function generateCopyPluginConfig(output) {
    const out = [];
    const ro = JSON.parse(resources.toString());
    const plat = os.platform() + '-' + os.arch();
    for (let [from, to] of Object.entries(ro)) {
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

module.exports = [baseConfig.main, baseConfig.renderer, generateCopyPluginConfig];
