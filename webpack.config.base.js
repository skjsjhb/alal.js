/*
 * The base common config for webpack builds.
 * Note that this cannot be used for build directly.
 */
const path = require("path");

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
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js", ".json", ".tsx"],
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    externals: {
        "lzma-native": "node-commonjs lzma-native"
    }
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
                },
                muiVendor: {
                    test: /[\\/]node_modules[\\/](@mui[\\/].*)[\\/]/,
                    name: 'vendor-mui',
                    chunks: 'all'
                }
            }
        }
    }
};

module.exports = [baseConfig.main, baseConfig.renderer, rendererOptimization];