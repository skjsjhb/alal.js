/*
 * The base common config for webpack builds.
 * Note that this cannot be used for build directly.
 */
const path = require("path");
const fs = require("fs");
const os = require("os");
const resources = fs.readFileSync("resources/build/resource-map.json");

const moduleResolution = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
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
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js", ".json", ".tsx"],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            'R': path.resolve(__dirname, 'resources'),
            'T': path.resolve(__dirname, "test")
        }
    },
    externals: [
        (ctx, callback) => {
            if (ctx.context.endsWith("lzma-native") && ctx.request === "node-gyp-build") {
                callback(null, "global node_gyp_build_lzma");
                return;
            }
            callback();
        }
    ]
};

const baseConfig = {
    main: {
        ...moduleResolution,
        target: "electron-main"
    },
    renderer: {
        ...moduleResolution,
        target: "electron-renderer"
    }
};

const rendererOptimization = {
    optimization: {
        splitChunks: {
            cacheGroups: {
                reactVendor: {
                    test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                    name: 'vendor-react',
                    chunks: 'all'
                }
            }
        }
    }
};

function generateCopyPluginConfig(output) {
    const out = [];
    const ro = JSON.parse(resources.toString());
    const plat = os.platform() + "-" + os.arch();
    for (let [from, to] of Object.entries(ro)) {
        from = from.replace("${platform}", plat);
        to = to.replace("${platform}", plat);
        if (fs.existsSync(from)) {
            out.push({
                from: from,
                to: path.join(output, String(to))
            });
        }
    }
    return out;
}

module.exports = [baseConfig.main, baseConfig.renderer, rendererOptimization, generateCopyPluginConfig];